#!/bin/sh
prettier --check '**/*' -u --ignore-path ../../.gitignore
tsc --noEmit
