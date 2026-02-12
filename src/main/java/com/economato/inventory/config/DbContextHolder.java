package com.economato.inventory.config;

/**
 * Mantiene el contexto del DataSource por hilo (ThreadLocal).
 * Permite que el RoutingDataSource sepa si debe usar WRITER o READER.
 */
public class DbContextHolder {

    private static final ThreadLocal<DataSourceType> CONTEXT = new ThreadLocal<>();

    public static void set(DataSourceType type) {
        CONTEXT.set(type);
    }

    public static DataSourceType get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
