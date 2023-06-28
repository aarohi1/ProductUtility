public class ProductUtility {
    @AuraEnabled
    public static productWrapper getFieldValues(){
       	map<string,map<string,list<sObject>>> recordsMap = new map<string,map<string,list<sObject>>>();
        Map<string,Map<String, String>> allObjFieldMap = new Map<string,Map<String, String>>();
        //Map<string,List<sObject>> discountTierMap = new Map<string,List<sObject>>();
        String query = 'SELECT ';
        String discountTierQuery;
        for(Product_Utility_Setting__mdt p_mdt : Product_Utility_Setting__mdt.getAll().values()){
            Map<String, String> fieldMap = new Map<String,String>();
            if(p_mdt.DeveloperName == 'Product2'){
                query += p_mdt.Display_Fields__c + ',';
            }
            else if(p_mdt.MasterLabel == 'Pricebook Entry'){
                query += '(SELECT Id,' + p_mdt.Display_Fields__c + ' FROM ' + p_mdt.Child_Relationship_Name__c + ' WHERE isActive = True AND Pricebook2.isActive = TRUE),'; 
            }
            else{
                if(p_mdt.Display_Fields__c != null)
                    query += '(SELECT Id,' + p_mdt.Display_Fields__c + ' FROM ' + p_mdt.Child_Relationship_Name__c + '),';
            }
            Map<String, Schema.SObjectField> MapofField = Schema.getGlobalDescribe().get(p_mdt.Object_API_Name__c).getDescribe().fields.getMap();
            for(String fieldName : MapofField.keyset()){
                if(p_mdt.Display_Fields__c.contains(',')){
                    for(string s : p_mdt.Display_Fields__c.split(',')){
                        if(s.trim() == fieldName){
                            if(p_mdt.DeveloperName == 'Product2')
                                fieldMap.put(s.trim(),MapofField.get(fieldName).getDescribe().getLabel() + ',' + MapofField.get(fieldName).getDescribe().getType());
                            else
                                fieldMap.put(s.trim(),MapofField.get(fieldName).getDescribe().getLabel());
                        }
                    }
                }
                else{
                    if(p_mdt.Display_Fields__c.trim() == fieldName){
                        if(p_mdt.DeveloperName == 'Product2')
                            fieldMap.put(p_mdt.Display_Fields__c.trim(),MapofField.get(fieldName).getDescribe().getLabel() + ',' + MapofField.get(fieldName).getDescribe().getType());
                        else
                            fieldMap.put(p_mdt.Display_Fields__c.trim(),MapofField.get(fieldName).getDescribe().getLabel());
                    }
                }
            }
            allObjFieldMap.put(p_mdt.MasterLabel,fieldMap);
        }
        query += ' Id FROM Product2 WHERE IsActive=true ' ;
        System.debug('Query==>'+query);
        List<sObject> lstRecords = Database.query(query);
       	System.debug('listRecord===>'+lstRecords);
        //List<sObject> discountTierRecords = Database.query(discountTierQuery);
        /*for(sObject discountTier : discountTierRecords){
            if(discountTier.getSObjects('SBQQ__DiscountTiers__r') != null && !discountTier.getSObjects('SBQQ__DiscountTiers__r').isEmpty()){
                if(!discountTierMap.containsKey(String.ValueOf(discountTier.getsObject('SBQQ__Product__r').get('Id')))){
                    discountTierMap.put(String.ValueOf(discountTier.getsObject('SBQQ__Product__r').get('Id')),discountTier.getSObjects('SBQQ__DiscountTiers__r'));
                }
                else{
                    if(discountTierMap.get(String.ValueOf(discountTier.getsObject('SBQQ__Product__r').get('Id'))) != null){
                        list<sObject> tempList = discountTierMap.get(String.ValueOf(discountTier.getsObject('SBQQ__Product__r').get('Id')));
                        tempList.addAll(discountTier.getSObjects('SBQQ__DiscountTiers__r'));
                        discountTierMap.put(String.ValueOf(discountTier.getsObject('SBQQ__Product__r').get('Id')),tempList);
                    }
                }
            }
        }*/
        for(sObject product : lstRecords){
            map<string,list<sObject>> tempMap = new map<string,list<sObject>>();
            for(Product_Utility_Setting__mdt p_mdt : Product_Utility_Setting__mdt.getAll().values()){
                if(p_mdt.DeveloperName == 'Product2'){
                    tempMap.put(p_mdt.MasterLabel,new list<sObject>{product});
                }
                else{
                    tempMap.put(p_mdt.MasterLabel,product.getSObjects(p_mdt.Child_Relationship_Name__c));
                }
            }
            recordsMap.put(string.valueof(product.get('Id')),tempMap);
        }
        
        productWrapper pw = new productWrapper();
        pw.fieldMap = allObjFieldMap;
        pw.recordList = recordsMap;
        return pw;
    }
}