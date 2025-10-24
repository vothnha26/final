package com.noithat.qlnt.backend.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

public class LenientBooleanDeserializer extends JsonDeserializer<Boolean> {
    @Override
    public Boolean deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        if (p == null) return null;
        switch (p.getCurrentToken()) {
            case VALUE_TRUE:
                return Boolean.TRUE;
            case VALUE_FALSE:
                return Boolean.FALSE;
            case VALUE_NUMBER_INT: {
                int v = p.getIntValue();
                return v != 0;
            }
            case VALUE_STRING: {
                String text = p.getText();
                if (text == null) return null;
                String s = text.trim().toLowerCase();
                if (s.isEmpty()) return null;
                if (s.equals("true") || s.equals("1") || s.equals("yes") || s.equals("y")) return Boolean.TRUE;
                if (s.equals("false") || s.equals("0") || s.equals("no") || s.equals("n")) return Boolean.FALSE;
                if (s.contains("hoat") || s.contains("dang") || s.contains("active") || s.contains("on")) return Boolean.TRUE;
                if (s.contains("khong") || s.contains("k") || s.contains("inactive") || s.contains("off")) return Boolean.FALSE;
                return Boolean.parseBoolean(s);
            }
            default:
                return (Boolean) ctxt.handleUnexpectedToken(Boolean.class, p);
        }
    }
}
