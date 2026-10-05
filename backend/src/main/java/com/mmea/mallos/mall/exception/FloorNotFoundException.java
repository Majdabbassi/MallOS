package com.mmea.mallos.mall.exception;

public class FloorNotFoundException extends RuntimeException {
    public FloorNotFoundException() {
        super("Floor not found");
    }
    public FloorNotFoundException(String message) {
        super(message);
    }
}
