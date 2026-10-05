package com.mmea.mallos.finance;

/** The invoice is not in a state that allows the operation (paying a paid invoice, canceling a paid one...). */
public class InvoiceStateException extends RuntimeException {
    public InvoiceStateException(String message) {
        super(message);
    }
}
