#!/bin/bash
# AegisIQ Neo4j entrypoint — ensures APOC is configured
echo "apoc.import.file.enabled=true" >> /var/lib/neo4j/conf/apoc.conf
echo "apoc.export.file.enabled=true" >> /var/lib/neo4j/conf/apoc.conf
