package com.mmea.mallos.finance;

/** Stored state of an invoice. "Late" is not stored: it is an unpaid invoice whose due date has passed. */
public enum InvoiceStatus {
    UNPAID,
    PAID,
    CANCELED
}
