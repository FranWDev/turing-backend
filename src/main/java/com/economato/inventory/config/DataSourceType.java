package com.economato.inventory.config;

/**
 * Enum que identifica el tipo de DataSource a usar.
 * WRITER para la base de datos primaria (escritura).
 * READER para la réplica (lectura).
 */
public enum DataSourceType {
    WRITER, READER
}
