// Blueprint JSON Schema Validation
// Engineering Plan v1.2 §2: "Formalise the Blueprint JSON Schema"
// This provides schema validation to ensure blueprints are valid before composition

import { BLOCKS, BLOCK_MAP } from "./blocks";
import type { Strategy, BlockInstance, UnmappedClause } from "./types";

/**
 * JSON Schema for StratoBot AI Blueprint validation
 * This schema ensures that any blueprint can be successfully composed into MQL5 code
 */
export const BLUEPRINT_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StratoBot AI Strategy Blueprint",
  "type": "object",
  "required": ["id", "name", "rawPrompt", "readback", "blocks", "unmapped", "createdAt", "updatedAt"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^strat-[0-9]+$",
      "description": "Unique strategy identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Human-readable strategy name"
    },
    "rawPrompt": {
      "type": "string",
      "minLength": 1,
      "description": "Original trader prompt"
    },
    "readback": {
      "type": "string",
      "minLength": 1,
      "description": "AI-generated restatement of the strategy"
    },
    "blocks": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/definitions/blockInstance"
      },
      "description": "Array of trading strategy blocks"
    },
    "unmapped": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/unmappedClause"
      },
      "description": "Clauses that couldn't be mapped to blocks"
    },
    "createdAt": {
      "type": "number",
      "description": "Unix timestamp of creation"
    },
    "updatedAt": {
      "type": "number",
      "description": "Unix timestamp of last update"
    }
  },
  "definitions": {
    "blockInstance": {
      "type": "object",
      "required": ["instanceId", "blockId", "params", "confidence"],
      "properties": {
        "instanceId": {
          "type": "string",
          "pattern": "^[a-z_]+-[0-9]+-[a-z0-9]+$",
          "description": "Unique instance identifier"
        },
        "blockId": {
          "type": "string",
          "enum": Object.keys(BLOCK_MAP),
          "description": "Must match a valid block ID from the library"
        },
        "params": {
          "type": "object",
          "description": "Block parameters (validated against block definition)"
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "AI confidence score for this block mapping"
        }
      }
    },
    "unmappedClause": {
      "type": "object",
      "required": ["text"],
      "properties": {
        "text": {
          "type": "string",
          "minLength": 1,
          "description": "Original text that couldn't be mapped"
        }
      }
    }
  }
};

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a blueprint against the schema and business rules
 */
export function validateBlueprintSchema(strategy: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Basic structure validation
  if (!strategy || typeof strategy !== "object") {
    errors.push({ path: "", message: "Blueprint must be an object" });
    return { valid: false, errors, warnings };
  }

  // Required fields
  const requiredFields = ["id", "name", "rawPrompt", "readback", "blocks", "unmapped", "createdAt", "updatedAt"];
  for (const field of requiredFields) {
    if (!(field in strategy)) {
      errors.push({ path: field, message: `Missing required field: ${field}` });
    }
  }

  // Field type validation
  if (strategy.id && typeof strategy.id !== "string") {
    errors.push({ path: "id", message: "id must be a string", value: strategy.id });
  } else if (strategy.id && !/^strat-[0-9]+$/.test(strategy.id)) {
    warnings.push({ path: "id", message: "id should match pattern strat-[0-9]+", value: strategy.id });
  }

  if (strategy.name && typeof strategy.name !== "string") {
    errors.push({ path: "name", message: "name must be a string", value: strategy.name });
  } else if (strategy.name && strategy.name.length > 100) {
    warnings.push({ path: "name", message: "name exceeds recommended length of 100 characters" });
  }

  if (strategy.rawPrompt && typeof strategy.rawPrompt !== "string") {
    errors.push({ path: "rawPrompt", message: "rawPrompt must be a string" });
  }

  if (strategy.readback && typeof strategy.readback !== "string") {
    errors.push({ path: "readback", message: "readback must be a string" });
  }

  if (strategy.createdAt && typeof strategy.createdAt !== "number") {
    errors.push({ path: "createdAt", message: "createdAt must be a number" });
  }

  if (strategy.updatedAt && typeof strategy.updatedAt !== "number") {
    errors.push({ path: "updatedAt", message: "updatedAt must be a number" });
  }

  // Array validation
  if (strategy.blocks && !Array.isArray(strategy.blocks)) {
    errors.push({ path: "blocks", message: "blocks must be an array" });
  } else if (strategy.blocks && strategy.blocks.length === 0) {
    errors.push({ path: "blocks", message: "blocks must contain at least one block" });
  }

  if (strategy.unmapped && !Array.isArray(strategy.unmapped)) {
    errors.push({ path: "unmapped", message: "unmapped must be an array" });
  }

  // Block validation
  if (Array.isArray(strategy.blocks)) {
    const seenBlockIds = new Set<string>();
    
    for (let i = 0; i < strategy.blocks.length; i++) {
      const block = strategy.blocks[i];
      const blockPath = `blocks[${i}]`;

      if (!block || typeof block !== "object") {
        errors.push({ path: blockPath, message: "Block must be an object" });
        continue;
      }

      // Block instance fields
      if (!block.instanceId || typeof block.instanceId !== "string") {
        errors.push({ path: `${blockPath}.instanceId`, message: "Block must have instanceId" });
      }

      if (!block.blockId || typeof block.blockId !== "string") {
        errors.push({ path: `${blockPath}.blockId`, message: "Block must have blockId" });
      } else {
        // Check if blockId exists in library
        if (!BLOCK_MAP[block.blockId]) {
          errors.push({ 
            path: `${blockPath}.blockId`, 
            message: `Unknown blockId: ${block.blockId}`,
            value: block.blockId 
          });
        } else {
          // Check for duplicates
          if (seenBlockIds.has(block.blockId)) {
            warnings.push({ 
              path: `${blockPath}.blockId`, 
              message: `Duplicate blockId: ${block.blockId}` 
            });
          }
          seenBlockIds.add(block.blockId);

          // Validate parameters against block definition
          const blockDef = BLOCK_MAP[block.blockId];
          if (block.params && typeof block.params === "object") {
            for (const paramDef of blockDef.params) {
              const paramPath = `${blockPath}.params.${paramDef.key}`;
              const value = block.params[paramDef.key];

              if (value === undefined || value === null || value === "") {
                errors.push({ 
                  path: paramPath, 
                  message: `Missing required parameter: ${paramDef.key}` 
                });
                continue;
              }

              // Type validation
              if (paramDef.type === "number") {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                  errors.push({ 
                    path: paramPath, 
                    message: `Parameter must be a number`,
                    value: value 
                  });
                } else {
                  if (paramDef.min !== undefined && numValue < paramDef.min) {
                    errors.push({ 
                      path: paramPath, 
                      message: `Parameter value ${numValue} is below minimum ${paramDef.min}`,
                      value: value 
                    });
                  }
                  if (paramDef.max !== undefined && numValue > paramDef.max) {
                    errors.push({ 
                      path: paramPath, 
                      message: `Parameter value ${numValue} is above maximum ${paramDef.max}`,
                      value: value 
                    });
                  }
                }
              }

              if (paramDef.type === "select") {
                const validOptions = paramDef.options?.map(o => o.value) || [];
                if (!validOptions.includes(String(value))) {
                  errors.push({ 
                    path: paramPath, 
                    message: `Invalid value "${value}". Valid options: ${validOptions.join(", ")}`,
                    value: value 
                  });
                }
              }
            }
          } else {
            errors.push({ path: `${blockPath}.params`, message: "Block must have params object" });
          }
        }
      }

      // Confidence validation
      if (typeof block.confidence !== "number") {
        errors.push({ path: `${blockPath}.confidence`, message: "confidence must be a number" });
      } else if (block.confidence < 0 || block.confidence > 1) {
        errors.push({ 
          path: `${blockPath}.confidence`, 
          message: "confidence must be between 0 and 1",
          value: block.confidence 
        });
      } else if (block.confidence < 0.5) {
        warnings.push({ 
          path: `${blockPath}.confidence`, 
          message: "Low confidence score - review recommended",
          value: block.confidence 
        });
      }
    }

    // Business rule: must have at least one entry/filter block
    const hasEntryBlock = strategy.blocks.some((b: any) => {
      const def = BLOCK_MAP[b.blockId];
      return def && def.role !== "exit";
    });

    if (!hasEntryBlock) {
      errors.push({ 
        path: "blocks", 
        message: "Strategy must contain at least one entry or filter block" 
      });
    }
  }

  // Unmapped clause validation
  if (Array.isArray(strategy.unmapped)) {
    for (let i = 0; i < strategy.unmapped.length; i++) {
      const clause = strategy.unmapped[i];
      const clausePath = `unmapped[${i}]`;

      if (!clause || typeof clause !== "object") {
        errors.push({ path: clausePath, message: "Unmapped clause must be an object" });
        continue;
      }

      if (!clause.text || typeof clause.text !== "string") {
        errors.push({ path: `${clausePath}.text`, message: "Unmapped clause must have text" });
      } else if (clause.text.trim().length === 0) {
        warnings.push({ path: `${clausePath}.text`, message: "Empty unmapped clause text" });
      }
    }
  }

  // Business logic validation
  if (strategy.createdAt && strategy.updatedAt && strategy.updatedAt < strategy.createdAt) {
    errors.push({ 
      path: "updatedAt", 
      message: "updatedAt cannot be before createdAt" 
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a blueprint and throws if invalid
 */
export function assertValidBlueprint(strategy: any): asserts strategy is Strategy {
  const result = validateBlueprintSchema(strategy);
  if (!result.valid) {
    throw new Error(
      `Blueprint validation failed:\n${result.errors.map(e => `${e.path}: ${e.message}`).join("\n")}`
    );
  }
}

/**
 * Sanitizes a blueprint by removing invalid fields and fixing common issues
 */
export function sanitizeBlueprint(strategy: any): Strategy {
  const sanitized: any = {};

  // Copy valid fields
  if (typeof strategy.id === "string") sanitized.id = strategy.id;
  if (typeof strategy.name === "string") sanitized.name = strategy.name.substring(0, 100);
  if (typeof strategy.rawPrompt === "string") sanitized.rawPrompt = strategy.rawPrompt;
  if (typeof strategy.readback === "string") sanitized.readback = strategy.readback;
  if (typeof strategy.createdAt === "number") sanitized.createdAt = strategy.createdAt;
  if (typeof strategy.updatedAt === "number") sanitized.updatedAt = strategy.updatedAt;

  // Sanitize blocks
  if (Array.isArray(strategy.blocks)) {
    sanitized.blocks = strategy.blocks
      .filter((block: any) => block && typeof block === "object" && block.blockId)
      .map((block: any) => {
        const sanitizedBlock: BlockInstance = {
          instanceId: typeof block.instanceId === "string" ? block.instanceId : `${block.blockId}-${Date.now()}`,
          blockId: block.blockId,
          params: {},
          confidence: typeof block.confidence === "number" ? Math.max(0, Math.min(1, block.confidence)) : 0.7
        };

        // Sanitize parameters
        if (block.params && typeof block.params === "object") {
          const blockDef = BLOCK_MAP[block.blockId];
          if (blockDef) {
            for (const paramDef of blockDef.params) {
              const value = block.params[paramDef.key];
              if (value !== undefined && value !== null && value !== "") {
                if (paramDef.type === "number") {
                  const numValue = Number(value);
                  if (!isNaN(numValue)) {
                    sanitizedBlock.params[paramDef.key] = Math.max(
                      paramDef.min ?? -Infinity,
                      Math.min(paramDef.max ?? Infinity, numValue)
                    );
                  }
                } else if (paramDef.type === "select") {
                  const validOptions = paramDef.options?.map(o => o.value) || [];
                  if (validOptions.includes(String(value))) {
                    sanitizedBlock.params[paramDef.key] = value;
                  }
                } else {
                  sanitizedBlock.params[paramDef.key] = paramDef.default;
                }
              } else {
                sanitizedBlock.params[paramDef.key] = paramDef.default;
              }
            }
          }
        }

        return sanitizedBlock;
      });
  }

  // Sanitize unmapped clauses
  if (Array.isArray(strategy.unmapped)) {
    sanitized.unmapped = strategy.unmapped
      .filter((clause: any) => clause && typeof clause.text === "string" && clause.text.trim().length > 0)
      .map((clause: any) => ({
        text: clause.text.trim()
      }));
  }

  // Ensure required fields
  if (!sanitized.id) sanitized.id = `strat-${Date.now()}`;
  if (!sanitized.name) sanitized.name = "Untitled Strategy";
  if (!sanitized.rawPrompt) sanitized.rawPrompt = "";
  if (!sanitized.readback) sanitized.readback = "";
  if (!sanitized.blocks) sanitized.blocks = [];
  if (!sanitized.unmapped) sanitized.unmapped = [];
  if (!sanitized.createdAt) sanitized.createdAt = Date.now();
  if (!sanitized.updatedAt) sanitized.updatedAt = Date.now();

  return sanitized as Strategy;
}