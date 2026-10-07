package com.mmea.mallos.maintenance;

/** The work order is not in a state that allows the change (editing a done order, reopening a canceled one...). */
public class WorkOrderStateException extends RuntimeException {
    public WorkOrderStateException(String message) {
        super(message);
    }
}
