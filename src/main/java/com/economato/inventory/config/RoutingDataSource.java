package com.economato.inventory.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * DataSource que delega dinámicamente al Writer o Reader
 * según el valor almacenado en DbContextHolder.
 */
public class RoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return DbContextHolder.get();
    }
}
