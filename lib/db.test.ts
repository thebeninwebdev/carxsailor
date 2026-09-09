import {beforeEach, expect, it, vi} from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({connect: vi.fn(), mongooseConnect: vi.fn()}));
vi.mock("mongodb", () => ({MongoClient: class {
  connect = mocks.connect;
  db() { return {}; }
}}));
vi.mock("mongoose", () => ({default: {connect: mocks.mongooseConnect}}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  const cache = globalThis as typeof globalThis & {mongoClient?: unknown; mongoosePromise?: unknown};
  delete cache.mongoClient;
  delete cache.mongoosePromise;
});

it("retries MongoDB after a connection failure and checks it on later requests", async () => {
  const {connectMongoClient, mongoClient} = await import("./db");
  mocks.connect.mockRejectedValueOnce(new Error("connection failed")).mockResolvedValue(mongoClient);
  await expect(connectMongoClient()).rejects.toThrow("connection failed");
  await expect(connectMongoClient()).resolves.toBe(mongoClient);
  await expect(connectMongoClient()).resolves.toBe(mongoClient);
  expect(mocks.connect).toHaveBeenCalledTimes(3);
});

it("shares pending Mongoose connections and allows a retry after rejection", async () => {
  const {connectMongoose} = await import("./db");
  mocks.mongooseConnect.mockRejectedValueOnce(new Error("connection failed")).mockResolvedValue({});
  const first = connectMongoose();
  expect(connectMongoose()).toBe(first);
  await expect(first).rejects.toThrow("connection failed");
  await expect(connectMongoose()).resolves.toEqual({});
  expect(mocks.mongooseConnect).toHaveBeenCalledTimes(2);
});
