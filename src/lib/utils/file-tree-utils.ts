/**
 * File Tree Utilities
 *
 * Generic tree traversal algorithms for nested file structures.
 * No game-specific logic - pure data structure operations.
 */

import { FilNode } from "@/types/innhold";

/**
 * Extract all file IDs from file tree recursively
 *
 * Traverses a nested file tree structure and collects all file IDs.
 * Ignores folders (type: "mappe") and only extracts files (type: "fil").
 *
 * @param nodes - Array of file tree nodes to traverse
 * @returns Array of file IDs (strings)
 *
 * @example
 * const fileTree = [
 *   { type: "mappe", navn: "docs", barn: [
 *     { type: "fil", navn: "readme.txt", innhold: "..." }
 *   ]}
 * ];
 * extractFileIds(fileTree) // ["readme.txt"]
 */
export function extractFileIds(nodes: FilNode[]): string[] {
  const fileIds: string[] = [];

  function traverse(node: FilNode) {
    if (node.type === "fil") {
      fileIds.push(node.navn);
    }
    if (node.barn) {
      node.barn.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return fileIds;
}

/**
 * Find a specific file node by ID in file tree
 *
 * Performs depth-first search through nested file structure.
 * Returns first matching file node or null if not found.
 *
 * @param fileId - Unique file identifier to search for
 * @param nodes - Array of file tree nodes to search
 * @returns File node if found, null otherwise
 *
 * @example
 * const fileTree = [
 *   { type: "mappe", navn: "logs", barn: [
 *     { type: "fil", navn: "error.log", innhold: "..." }
 *   ]}
 * ];
 * findFileNode("error.log", fileTree) // Returns file node
 * findFileNode("missing.txt", fileTree) // Returns null
 */
export function findFileNode(fileId: string, nodes: FilNode[]): FilNode | null {
  for (const node of nodes) {
    if (node.type === "fil" && node.navn === fileId) {
      return node;
    }
    if (node.barn) {
      const found = findFileNode(fileId, node.barn);
      if (found) return found;
    }
  }
  return null;
}
