package com.mmea.mallos.maintenance;

public class WorkOrderNotFoundException extends RuntimeException {
    public WorkOrderNotFoundException() {
        super("Work order not found");
    }
}
