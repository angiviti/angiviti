angular.module('angiviti', ['ng'])

    .config(['$provide', function ($provide) {

        $AngivitiProvider = function () {
            var BPMNDigested = {};
            var currTask;

            digest = function (rawData) {
                BPMNDigested.procId = rawData.processInstanceID
                BPMNDigested.Bpmn = {
                    flowMap: rawData.bpmnModel.processes[0].flowElementMap,
                    initialElement: rawData.bpmnModel.processes[0].initialFlowElement
                }
                BPMNDigested.userTasks = rawData.userTasks
                BPMNDigested.scriptTasks = rawData.scriptTasks
                BPMNDigested.sequenceFlow = rawData.sequenceFlow
                BPMNDigested.startEvents = rawData.startEvents
                BPMNDigested.endEvents = rawData.endEvents
                BPMNDigested.paraNaoPartirNada = rawData.bpmnModel.processes[0].flowElementMap
            }

            getNextTask = function () {
                if (!currTask) {
                    const startElement = BPMNDigested.Bpmn.initialElement
                    currTask = startElement.id
                    if (startElement.formKey) return startElement.id
                    return getNextTask()
                }
                var arrow = isArrow(currTask)
                var nextTask
                if (arrow) nextTask = arrow.targetRef
                else nextTask = BPMNDigested.Bpmn.flowMap[currTask].outgoingFlows[0].id
                arrow = isArrow(nextTask)
                if (arrow && arrow.conditionExpression) return "NAO PODEMOS AVANÇAR"

                if (arrow && !arrow.conditionExpression) {
                    currTask = arrow.id
                    return getNextTask()
                }

                const endTask = isEndTask(nextTask)

                if (endTask) {
                    currTask = endTask.id
                    return "ACABOU"
                }

                const usertask = isUserTask(nextTask)

                if (usertask) {
                    currTask = usertask.id
                    return currTask
                }
                return getNextTask()
            }

            isArrow = function (id) {
                return BPMNDigested.sequenceFlow.find(function (element) {
                    return element.id == id;
                })
            }

            isUserTask = function (id) {
                return BPMNDigested.userTasks.find(function (element) {
                    return element.id == id;
                })
            }

            isScriptTask = function (id) {
                return BPMNDigested.scriptTasks.find(function (element) {
                    return element.id == id;
                })
            }

            isEndTask = function (id) {
                return BPMNDigested.endEvents.find(function (element) {
                    return element.id == id;
                })
            }

            convertToHTMLType = function (bpmType) {
                switch (bpmType) {
                    case 'string': return 'text'
                    case 'long': return 'number'
                    default: return ''
                }
            }

            this.$get = ['$http', '$window' , function ($http, $window) {
                var configFile;

                $angiviti = {}

                function getConfigFile() {
                    $http.get('configAngiviti.json').then(function successCallback(response) {
                        configFile = response.data
                    }, function errorCallback(response) {
                        console.log("No file to read")
                    });
                }

                getConfigFile()

                $angiviti.start = function () {
                    $http.get(configFile.startUri).then(function successCallback(response) {
                        digest(response.data)
                        getNextTask()
                        $window.location.href = configFile.webAppFirstTaskUri
                    }, function errorCallback(response) {
                        console.log('ERRO IN STARTING')
                    });

                }

                $angiviti.next = function () {
                    getNextTask()
                }

                $angiviti.currentTask = function () {
                    
                    const forms = BPMNDigested.Bpmn.flowMap[currTask].formProperties
                    var finalForm = ''
                    const dataBindConfig = configFile[currTask].dataBinding
                    for (var i = 0; i < forms.length; i++) {
                        finalForm +=
                            '<input type=' + convertToHTMLType(forms[i].type) +
                            ' ng-model=' + dataBindConfig[i] +
                            ' placeholder=' + forms[i].id + ' class="form-control"/>'
                    }
                    return finalForm

                }

                $angiviti.endTask = function (body) {
                    $http.post(configFile[currTask].endUri.replace('{0}',BPMNDigested.procId), body)
                        .then(function successCallback(response) {
                            console.log("No error")
                        }, function errorCallback(response) {
                            console.log('ERROR ENDING TASK')
                        });
                    getNextTask()
                }

                return $angiviti;
            }]
        }

        $provide.provider('$angiviti', $AngivitiProvider);
    }])