package com.mmea.mallos.mall.exception;

public class PolygonNotFoundException extends RuntimeException {
    public PolygonNotFoundException() {
        super("Polygon not found");
    }
    public PolygonNotFoundException(String message) {
        super(message);
    }
}
