# Synthetic still-detects control (AIO-1074) — DO NOT MERGE

This file carries no real identifier. Its *path* alone is the control: the leak
gate's baseline path rule treats `clients/<name>/` in a product repo as client
material that does not belong here.

If the trust-boundary migration had moved the scan onto a tree the scanner no
longer reaches, this file would go unnoticed and the gate would report CLEAN.
The gate must fail on it instead, and must name only "location withheld" rather
than this path.
