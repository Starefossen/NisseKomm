#!/bin/bash
cd "$(dirname "$0")"
NODE_ENV=test ./node_modules/.bin/jest src/lib/__tests__/sanity-storage.test.ts -t "should isolate data between different tenants"
