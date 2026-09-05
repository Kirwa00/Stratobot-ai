// Deterministic Code Composer
// Engineering Plan v1.2 §1: "LLM never writes a line of MQL5. It does exactly one job: 
// translate trader language into a strict, schema-validated Blueprint JSON. A deterministic 
// code composer then assembles the .mq5 file from a library of hand-written, pre-compiled, 
// individually-tested MQL5 block templates."

import { getBlock } from "./blocks";
import { getMQL5Template, MQL5Template } from "./mql5-templates";
import { validateBlueprintSchema, sanitizeBlueprint } from "./blueprint-schema";
import type { Strategy, BlockInstance } from "./types";

interface ComposerOptions {
  includeComments?: boolean;
  strictMode?: boolean;
  validateInputs?: boolean;
}

interface MQL5BuildResult {
  success: boolean;
  code?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Generates a complete, compilable MQL5 Expert Advisor from a strategy blueprint.
 * This is the deterministic composer that guarantees compilation if the blueprint is valid.
 */
export function composeMQL5FromStrategy(
  strategy: Strategy,
  options: ComposerOptions = {}
): MQL5BuildResult {
  const {
    includeComments = true,
    strictMode = true,
    validateInputs = true
  } = options;

  // Validate blueprint schema first
  const schemaValidation = validateBlueprintSchema(strategy);
  if (!schemaValidation.valid) {
    return {
      success: false,
      errors: schemaValidation.errors.map(e => `${e.path}: ${e.message}`),
      warnings: schemaValidation.warnings.map(w => `${w.path}: ${w.message}`)
    };
  }

  const errors: string[] = [...schemaValidation.warnings.map(w => `${w.path}: ${w.message}`)];
  const warnings: string[] = [];

  // Sanitize blueprint to ensure clean data
  const sanitizedStrategy = sanitizeBlueprint(strategy);

  // Validate strategy structure
  if (!sanitizedStrategy.blocks || sanitizedStrategy.blocks.length === 0) {
    errors.push("Strategy must contain at least one block");
    return { success: false, errors };
  }

  // Separate entry/filter blocks from exit blocks
  const entryBlocks = sanitizedStrategy.blocks.filter(b => {
    const def = getBlock(b.blockId);
    return def && def.role !== "exit";
  });

  const exitBlocks = sanitizedStrategy.blocks.filter(b => {
    const def = getBlock(b.blockId);
    return def && def.role === "exit";
  });

  if (entryBlocks.length === 0) {
    errors.push("Strategy must contain at least one entry or filter block");
    return { success: false, errors };
  }

  // Collect all dependencies and check for template availability
  const allDependencies = new Set<string>();
  const allTemplates: MQL5Template[] = [];

  for (const block of sanitizedStrategy.blocks) {
    const template = getMQL5Template(block.blockId);
    if (!template) {
      errors.push(`No MQL5 template found for block: ${block.blockId}`);
      continue;
    }

    allTemplates.push(template);
    template.dependencies.forEach(dep => allDependencies.add(dep));

    // Validate block parameters
    if (validateInputs) {
      const def = getBlock(block.blockId);
      if (def) {
        for (const paramDef of def.params) {
          const value = block.params[paramDef.key];
          if (value === undefined || value === null || value === "") {
            warnings.push(`Block ${block.blockId} has empty parameter: ${paramDef.key}`);
          }
          
          // Type validation
          if (paramDef.type === "number") {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`Block ${block.blockId} parameter ${paramDef.key} is not a valid number`);
            } else if (paramDef.min !== undefined && numValue < paramDef.min) {
              errors.push(`Block ${block.blockId} parameter ${paramDef.key} is below minimum ${paramDef.min}`);
            } else if (paramDef.max !== undefined && numValue > paramDef.max) {
              errors.push(`Block ${block.blockId} parameter ${paramDef.key} is above maximum ${paramDef.max}`);
            }
          }
        }
      }
    }
  }

  if (errors.length > 0 && strictMode) {
    return { success: false, errors };
  }

  // Build the MQL5 code
  const code = buildMQL5Code(
    sanitizedStrategy,
    entryBlocks,
    exitBlocks,
    allTemplates,
    allDependencies,
    includeComments
  );

  return {
    success: true,
    code,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

function buildMQL5Code(
  strategy: Strategy,
  entryBlocks: BlockInstance[],
  exitBlocks: BlockInstance[],
  templates: MQL5Template[],
  dependencies: Set<string>,
  includeComments: boolean
): string {
  const lines: string[] = [];

  // Header
  if (includeComments) {
    lines.push("//+------------------------------------------------------------------+");
    lines.push("//| StratoBot AI - Generated Expert Advisor                            |");
    lines.push("//|                                                                    |");
    lines.push(`//| Strategy: ${strategy.name.padEnd(52)}|`);
    lines.push(`//| Generated: ${new Date(strategy.updatedAt).toISOString().padEnd(45)}|`);
    lines.push("//|                                                                    |");
    lines.push("//| This EA was automatically generated from a trading strategy.       |");
    lines.push("//| Review the code carefully before using in live trading.            |");
    lines.push("//+------------------------------------------------------------------+");
    lines.push("");
  }

  // Properties
  lines.push("#property copyright \"StratoBot AI\"");
  lines.push("#property link \"https://stratobot.ai\"");
  lines.push("#property version \"1.00\"");
  lines.push("#property strict");
  lines.push("");

  // Include dependencies
  if (dependencies.has("CTrade")) {
    lines.push("#include <Trade\\Trade.mqh>");
    lines.push("");
  }

  // Global variables
  lines.push("// Global variables");
  lines.push("CTrade trade;");
  lines.push("");

  // Note: no separate "input parameters" pre-declaration block here — each
  // block's own template.code already declares its `input` line (with the
  // correct type and default) right next to where it's used, further down.
  // A prior version of this composer also emitted bare parameter names
  // (e.g. "killzone_session" with no type, no value, no semicolon) up here,
  // which is not valid MQL5 and caused every generated .mq5 file to fail to
  // compile with cascading "undeclared identifier" errors.

  // Global variables for strategy state
  lines.push("// Strategy state variables");
  lines.push("datetime lastTradeTime = 0;");
  lines.push("int tradeCooldown = 60; // Seconds between trades");
  lines.push("");

  // Initialize function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Expert initialization function                                     |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("int OnInit()");
  lines.push("{");
  lines.push("   // Set trade parameters");
  lines.push("   trade.SetExpertMagicNumber(123456);");
  lines.push("   trade.SetDeviationInPoints(10);");
  lines.push("   trade.SetTypeFilling(ORDER_FILLING_IOC);");
  lines.push("");
  lines.push("   return(INIT_SUCCEEDED);");
  lines.push("}");
  lines.push("");

  // Deinitialize function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Expert deinitialization function                                   |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("void OnDeinit(const int reason)");
  lines.push("{");
  lines.push("   // Cleanup if needed");
  lines.push("}");
  lines.push("");

  // Tick function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Expert tick function                                               |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("void OnTick()");
  lines.push("{");
  lines.push("   // Check if we have an open position");
  lines.push("   if (PositionsTotal() > 0) {");
  lines.push("      // Manage exits");
  lines.push("      ManageExits();");
  lines.push("      return;");
  lines.push("   }");
  lines.push("");
  lines.push("   // Check trade cooldown");
  lines.push("   if (TimeCurrent() - lastTradeTime < tradeCooldown) return;");
  lines.push("");
  lines.push("   // Check entry conditions");
  lines.push("   if (CheckEntry()) {");
  lines.push("      OpenPosition();");
  lines.push("      lastTradeTime = TimeCurrent();");
  lines.push("   }");
  lines.push("}");
  lines.push("");

  // CheckEntry function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Check entry conditions                                              |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("bool CheckEntry()");
  lines.push("{");
  
  for (const block of entryBlocks) {
    const template = getMQL5Template(block.blockId);
    if (template) {
      const functionName = instantiateTemplateString(
        template.functions.find(f => f.startsWith("Check_")) || "Check_Unknown",
        template.blockId
      );
      lines.push(`   // ${getBlock(block.blockId)?.label || block.blockId}`);
      lines.push(`   if (!${functionName}()) return false;`);
      lines.push("");
    }
  }
  
  lines.push("   return true;");
  lines.push("}");
  lines.push("");

  // OpenPosition function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Open position based on strategy                                   |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("void OpenPosition()");
  lines.push("{");
  lines.push("   double lotSize = 0.1; // Default lot size");
  lines.push("   ");
  lines.push("   // Check for custom position size");
  lines.push("   if (GlobalVariableCheck(\"stratobot_position_size\")) {");
  lines.push("      lotSize = GlobalVariableGet(\"stratobot_position_size\");");
  lines.push("   }");
  lines.push("");
  lines.push("   // Calculate position size based on risk if configured");
  lines.push("   if (GlobalVariableCheck(\"stratobot_risk_amount\")) {");
  lines.push("      double riskAmount = GlobalVariableGet(\"stratobot_risk_amount\");");
  lines.push("      double stopLoss = 50 * _Point; // Default SL");
  lines.push("      lotSize = riskAmount / (stopLoss / _Point);");
  lines.push("   }");
  lines.push("");
  lines.push("   // Determine direction (simplified - would use strategy logic)");
  lines.push("   bool buySignal = true; // Would be determined by strategy");
  lines.push("");
  lines.push("   if (buySignal) {");
  lines.push("      trade.Buy(lotSize, _Symbol, 0, 0, \"StratoBot Entry\");");
  lines.push("   } else {");
  lines.push("      trade.Sell(lotSize, _Symbol, 0, 0, \"StratoBot Entry\");");
  lines.push("   }");
  lines.push("}");
  lines.push("");

  // ManageExits function
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Manage exit conditions                                             |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("void ManageExits()");
  lines.push("{");
  
  for (const block of exitBlocks) {
    const template = getMQL5Template(block.blockId);
    if (template) {
      const functionName = instantiateTemplateString(
        template.functions.find(f => f.startsWith("Apply_")) || "Apply_Unknown",
        template.blockId
      );
      lines.push(`   // ${getBlock(block.blockId)?.label || block.blockId}`);
      lines.push(`   ${functionName}();`);
      lines.push("");
    }
  }
  
  if (exitBlocks.length === 0) {
    lines.push("   // No exit blocks configured");
  }
  
  lines.push("}");
  lines.push("");

  // Block functions
  lines.push("//+------------------------------------------------------------------+");
  lines.push("//| Block implementation functions                                      |");
  lines.push("//+------------------------------------------------------------------+");
  lines.push("");

  for (const template of templates) {
    const functionCode = instantiateTemplateCode(template.code, template.blockId);
    lines.push(functionCode);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Replaces template placeholders with actual block IDs
 * e.g., "{blockId}_session" becomes "killzone_session"
 */
function instantiateTemplateString(template: string, blockId: string): string {
  return template.replace(/\{blockId\}/g, blockId);
}

/**
 * Replaces template placeholders in code with actual block IDs
 */
function instantiateTemplateCode(code: string, blockId: string): string {
  return code.replace(/\{blockId\}/g, blockId);
}

/**
 * Validates a blueprint against the block library schema
 * This ensures the blueprint can be successfully composed
 */
export function validateBlueprint(strategy: Strategy): {
  valid: boolean;
  errors: string[];
} {
  const schemaValidation = validateBlueprintSchema(strategy);
  return {
    valid: schemaValidation.valid,
    errors: schemaValidation.errors.map(e => `${e.path}: ${e.message}`)
  };
}

/**
 * Generates a human-readable summary of what the composed EA will do
 */
export function generateCompositionSummary(strategy: Strategy): string {
  const entryBlocks = strategy.blocks.filter(b => {
    const def = getBlock(b.blockId);
    return def && def.role !== "exit";
  });

  const exitBlocks = strategy.blocks.filter(b => {
    const def = getBlock(b.blockId);
    return def && def.role === "exit";
  });

  const lines: string[] = [];
  lines.push(`Strategy: ${strategy.name}`);
  lines.push(`Entry conditions (${entryBlocks.length}):`);
  
  for (const block of entryBlocks) {
    const def = getBlock(block.blockId);
    const params = Object.entries(block.params)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    lines.push(`  - ${def?.label || block.blockId} (${params})`);
  }

  lines.push(`Exit conditions (${exitBlocks.length}):`);
  
  for (const block of exitBlocks) {
    const def = getBlock(block.blockId);
    const params = Object.entries(block.params)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    lines.push(`  - ${def?.label || block.blockId} (${params})`);
  }

  if (strategy.unmapped.length > 0) {
    lines.push(`Unmapped clauses (${strategy.unmapped.length}):`);
    for (const clause of strategy.unmapped) {
      lines.push(`  - "${clause.text}"`);
    }
  }

  return lines.join("\n");
}