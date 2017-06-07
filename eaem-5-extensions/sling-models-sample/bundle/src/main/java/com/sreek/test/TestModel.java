package com.sreek.test;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import javax.inject.Inject;

@Model(adaptables=Resource.class)
public class TestModel {
    @Inject
    private String text;

    public String getText(){
        return text;
    }
}
