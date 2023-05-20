const fs = require('fs');
const pug = require('pug');
const showdown  = require('showdown');
const sass = require('sass');

const plugins = {
    "Markdown2Html": {
        init: initMarkdown2Html,
        apply: applyMarkdown2Html
    },
    "ApplyPugTemplate": {
        init: initPugTemplate,
        apply: applyPugTemplate,
        applyAggregate: applyPugTemplateAggregate
    },
    "WriteFile":{
        init: initWriteFile,
        apply: applyWriteFile
    },
    "Aggregate":{
        init: () => {},
        apply: () => {}
    },
    "CompileSass":{
        init: () => {},
        apply: applySassCompile
    }
}

///CompileSass Plugin Begin
function applySassCompile(text, itemConfig, pluginContext){
    return sass.compileString(text).css;
}

///CompileSass Plugin End

///ApplyPugTemplate Plugin Begin
function initPugTemplate(pluginSettings) {
    var pluginContext = {};
    pluginContext.pugPageCompiler = pug.compileFile(pluginSettings.template);
    return pluginContext;
}

function applyPugTemplate(generatedText, itemConfig, pluginContext) {
    var templateData = {
        item: itemConfig,
        text: generatedText
    };

    return pluginContext.pugPageCompiler(templateData);
}

function applyPugTemplateAggregate(items, pluginContext) {
    var texts = [];
    for(const item of items){
        texts.push(item.text);
    }

    var templateData = {
        texts: texts
    };

    return [{ text: pluginContext.pugPageCompiler(templateData), itemConfig: {}}];
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
        var file = itemConfig.fileName ? itemConfig.fileName : itemConfig["**originalFileName"];
        fileName = fileName + file + "." + pluginContext.extension;
    } else if(pluginContext.strategy === "writeWithName") {
        fileName = fileName + pluginContext.fileName;
    }

    fs.writeFileSync(fileName, fileText);
    return fileText;
}
/// WriteFile Plugin End

///Pipeline Execution Engine Begin
function buildPipeline(pipeline) {
    var pipelineData = { stages: []};
    for(const config of pipeline) {
        var plugin = plugins[config.plugin];
        var pluginConfig = plugin.init(config.pluginSettings);
        pipelineData.stages.push({ plugin: plugin, config: pluginConfig, aggregator: config.aggregate });
    }
    return pipelineData;
}

function executePipeline(inputs, pipeline) {
    var currents = inputs;

    for(const stage of pipeline.stages) {
        var nexts = [];
        if(stage.aggregator) {
            nexts = stage.plugin.applyAggregate(currents, stage.config);
        } else {
            for(const item of currents) {
                var next = {
                    itemConfig: item.itemConfig,
                    text: stage.plugin.apply(item.text, item.itemConfig, stage.config)
                };
                nexts.push(next);
            }
        }
        currents = nexts;
    }
}

function findFilesForJob(pipelineConfig) {
    var matchingFiles = [];
    var matcher = new RegExp(pipelineConfig.fileMatcher);

    fs.readdirSync(".").forEach(file => {
        if(matcher.test(file)) {
            matchingFiles.push(file);
        }
    });

    return matchingFiles;
}
///Pipeline Execution Engine End

const folder = "betterPosts/";
process.chdir(folder);

var pipelines = JSON.parse(fs.readFileSync("./config.json"));

for(const pip of pipelines) {
    var testy = {};
    testy.fileNames = findFilesForJob(pip);

    if(pip.type === "pipeline") {
        testy.files = [];
        testy.pipeline = buildPipeline(pip.pipeline);

        for(const fileName of testy.fileNames) {
            var item = { name: fileName };
            var file = fs.readFileSync("./" + fileName, 'utf8');
            var hasConf = file.search(/\*\*\*\*\*/);
            if(hasConf >= 0){
                var conf = JSON.parse(file.substring(0, hasConf));
                var text = file.substring(hasConf + 7);
                item.itemConfig = conf;
                item.text = text;
            } else {
                item.itemConfig = {};
                item.text = file;
            }
            
            item.itemConfig["**originalFileName"] = fileName.substring(0, fileName.search(/\./));
            testy.files.push(item);
        }

        executePipeline(testy.files, testy.pipeline);
    }

    if(pip.type === "copy") {
        for(const fileName of testy.fileNames) {
            fs.copyFileSync(fileName, pip.location + "/" + fileName);
        }
    }
}