public class productWrapper{
        @AuraEnabled
        public Map<string,Map<String, String>> fieldMap{get;set;}
        @AuraEnabled
        public map<string,map<string,list<sObject>>> recordList{get;set;}
    }