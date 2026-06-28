package com.mmea.mallos.mall.exception;

public class InvalidMallOperationException extends RuntimeException {
    public InvalidMallOperationException() { super("Invalid mall operation"); }
    public InvalidMallOperationException(String message) { super(message); }
}
