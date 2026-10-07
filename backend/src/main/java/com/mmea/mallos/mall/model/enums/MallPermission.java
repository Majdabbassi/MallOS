package com.mmea.mallos.mall.model.enums;

/**
 * What a manager can give an assistant. MANAGE_EMPLOYEES lets an assistant run the team (within their own rights),
 * EDIT_REPORTS lets them export reports as CSV, MANAGE_ORDERS lets them handle maintenance work orders.
 */
public enum MallPermission {
    /** @deprecated no longer offered (a mall has no product catalog); kept so rows saved earlier still load. */
    @Deprecated
    MANAGE_PRODUCTS,
    MANAGE_EMPLOYEES,
    VIEW_REPORTS,
    EDIT_REPORTS,
    MANAGE_ORDERS,
    VIEW_FINANCE,
    MANAGE_FINANCE,
    MANAGE_STORES,
    MANAGE_FLOORPLAN
}
