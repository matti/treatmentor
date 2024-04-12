#!/usr/bin/env bash

node index.mjs || echo "Error: Node.js exited with code $?"

tail -f /dev/null & wait
