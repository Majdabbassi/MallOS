package com.mmea.mallos.mall.exception;

public class MallNotFoundException extends RuntimeException {
    public MallNotFoundException() { super("Mall not found"); }
    public MallNotFoundException(String message) { super(message); }
}
