import variables from "../../frontend/src/constants/variables.js";
export function resolveValue(value) {
    if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
      const key = value.slice(2, -1); // Remove ${ and }
      console.log(`Resolving variable: ${key}`); // Log variable resolution
      return variables[key] || value; // Return variable value or original if not found
    }
    return value; // Return as is if not a variable
  }