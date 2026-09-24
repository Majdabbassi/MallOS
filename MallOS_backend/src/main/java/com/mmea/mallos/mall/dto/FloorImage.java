package com.mmea.mallos.mall.dto;

/**
 * Raw floor-plan image data returned to the authenticated image endpoint.
 */
public record FloorImage(byte[] data, String contentType) {
}