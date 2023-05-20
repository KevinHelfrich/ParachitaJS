const fs = require('fs');
const pug = require('pug');
const showdown  = require('showdown');

const plugins = {
    "Markdown2Html": {
        init: initMarkdown2Html,
        apply: applyMarkdown2Html
    },
    "ApplyPugTemplate": {
        init: initPugTemplate,
        apply: applyPugTemplate
    },
    "WriteFile":{
        init: initWriteFile,
        apply: applyWriteFile
    },
    "Aggregate":{},
    "CompileSass":{}
}

///ApplyPugTemplate Plugin Begin
function initPugTemplate(pluginSettings) {
    var pluginContext = {};
    pluginContext.pugPageCompiler = pug.compileFile(pluginSettings.template);
    return pluginContext;
}

function applyPugTemplate(generatedText, itemConfig, pluginContext) {
    return pluginContext.pugPageCompiler({
        text: generatedText,
        item: itemConfig
    });
}

///ApplyPugTemplate Plugin End

/// Markdown2Html Plugin Begin
var mdConverter = new showdown.Converter();
function initMarkdown2Html(pluginSettings) {
    var pluginContext = {};
    pluginContext.converter = mdConverter;
    return pluginContext;
}

function applyMarkdown2Html(markdownText, itemConfig, pluginContext) {
    return pluginContext.converter.makeHtml(markdownText);
}
/// Markdown2Html Plugin End

/// WriteFile Plugin Begin
function initWriteFile(pluginSettings) {
    var pluginContext = {};
    pluginContext.location = pluginSettings.location;

    if(pluginSettings.extension) {
        pluginContext.strategy = "writeWithExtension";
        pluginContext.extension = pluginSettings.extension;
    }

    if(pluginSettings.name) {
        pluginContext.strategy = "writeWithName";
        pluginContext.fileName = pluginSettings.name;
    }

    if(!pluginContext.strategy) {
        throw new Error("No valid file writing strategy found! Please provide either a file name or extension");
    }

    if (!fs.existsSync(pluginContext.location)){
        fs.mkdirSync(pluginContext.location);
    }

    return pluginContext;
}

function applyWriteFile(fileText, itemConfig, pluginContext) {
    var fileName = pluginContext.location + "/";

    if(pluginContext.strategy === "writeWithExtension") {
        fileName = fileName + itemConfig.fileName + "." + pluginContext.extension;
    } else if(pluginContext.strategy === "writeWithName") {
        fileName = fileName + pluginContext.fileName;
    }

    fs.writeFileSync(fileName, fileText);
    return fileText;
}
/// WriteFile Plugin End

const testPipeline = {
    "name": "genPosts",
    "fileMatcher": ".*\\.md$",
    "pipeline": [{
        "plugin": "Markdown2Html"
    },{
        "plugin": "ApplyPugTemplate",
        "pluginSettings": {
            "template": "./betterPosts/post.pug"
        }
    },{
        "plugin": "WriteFile",
        "pluginSettings": {
            "location": "./out",
            "extension": "html"
        }
    }]
};
const folder = "betterPosts/";

///Pipeline Execution Engine Begin
function buildPipeline(pipelineConfig) {
    var pipeline = { stages: []};
    for(const config of pipelineConfig) {
        var plugin = plugins[config.plugin];
        var pluginConfig = plugin.init(config.pluginSettings);
        pipeline.stages.push({ plugin: plugin, config: pluginConfig });
    }
    return pipeline;
}

function executePipeline(inputs, pipeline) {
    var currents = inputs;

    for(const stage of pipeline.stages) {
        var nexts = [];
        for(const item of currents) {
            var next = {
                itemConfig: item.itemConfig,
                text: stage.plugin.apply(item.text, item.itemConfig, stage.config)
            };
            nexts.push(next);
        }
        currents = nexts;
    }
}
///Pipeline Execution Engine End

var test = buildPipeline(testPipeline.pipeline);

var inp = [{
    text: "## Hello World!",
    itemConfig: {
        fileName: "hello"
    }
}];

executePipeline(inp, test);