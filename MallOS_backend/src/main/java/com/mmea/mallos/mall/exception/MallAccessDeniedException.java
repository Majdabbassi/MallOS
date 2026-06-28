package com.mmea.mallos.mall.exception;

public class MallAccessDeniedException extends RuntimeException {
    public MallAccessDeniedException() { super("Access denied to mall resource"); }
    public MallAccessDeniedException(String message) { super(message); }
}
