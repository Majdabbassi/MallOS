package com.mmea.mallos.mall.exception;

public class UserAlreadyMemberException extends RuntimeException {
    public UserAlreadyMemberException() { super("User is already an active member of the mall"); }
    public UserAlreadyMemberException(String message) { super(message); }
}
