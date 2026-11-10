import { describe, it, expect, beforeEach } from "@jest/globals";
import { LocalStorageAdapter } from "../storage-adapter";

describe("LocalStorage Adapter", () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it("should set and get primitive values", () => {
    adapter.set("test-key", "test-value");
    expect(adapter.get("test-key", "default")).toBe("test-value");
  });

  it("should set and get objects", () => {
    const obj = { name: "Alice", age: 10 };
    adapter.set("test-obj", obj);
    expect(adapter.get("test-obj", {})).toEqual(obj);
  });

  it("should set and get arrays", () => {
    const arr = [1, 2, 3];
    adapter.set("test-arr", arr);
    expect(adapter.get("test-arr", [])).toEqual(arr);
  });

  it("should return default value for missing keys", () => {
    expect(adapter.get("missing", "default")).toBe("default");
  });

  it("should check if key exists", () => {
    adapter.set("exists", true);
    expect(adapter.has("exists")).toBe(true);
    expect(adapter.has("missing")).toBe(false);
  });

  it("should remove keys", () => {
    adapter.set("to-remove", "value");
    expect(adapter.has("to-remove")).toBe(true);
    adapter.remove("to-remove");
    expect(adapter.has("to-remove")).toBe(false);
  });

  it("should clear all data", () => {
    adapter.set("key1", "value1");
    adapter.set("key2", "value2");
    adapter.clear();
    expect(adapter.has("key1")).toBe(false);
    expect(adapter.has("key2")).toBe(false);
  });
});
