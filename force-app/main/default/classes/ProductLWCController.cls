public with sharing class ProductLWCController {

    private static String builtProductQuery(){
        String productQuery = 'SELECT ';

        Product_Utility_Setting__mdt productMetaData = Product_Utility_Setting__mdt.getInstance('Product2');
        productQuery += productMetaData.Display_Fields__c + ',';

        Product_Utility_Setting__mdt priceMetaData = Product_Utility_Setting__mdt.getInstance('PricebookEntry');
        productQuery += '(SELECT Id,' + priceMetaData.Display_Fields__c + ' FROM ' + priceMetaData.Child_Relationship_Name__c + ' WHERE isActive = True AND Pricebook2.isActive = TRUE),'; 

        //Product_Utility_Setting__mdt discountMetaData = Product_Utility_Setting__mdt.getInstance('SBQQ_DiscountTier');
        //productQuery += '(SELECT Id,' + discountMetaData.Display_Fields__c + ' FROM ' + discountMetaData.Child_Relationship_Name__c + ' WHERE isActive = True AND Pricebook2.isActive = TRUE),'; 

        for(Product_Utility_Setting__mdt metaData : Product_Utility_Setting__mdt.getAll().values()){
            
            if(metaData.DeveloperName != 'Product2' && metaData.DeveloperName != 'PricebookEntry' && metaData.DeveloperName != 'SBQQ_DiscountTier'){
                if(metaData.Display_Fields__c != null) {
                    productQuery += '(SELECT Id,' + metaData.Display_Fields__c + ' FROM ' + metaData.Child_Relationship_Name__c + '),';
                }
            }   
        }
        productQuery = productQuery.removeEnd(',');
        return productQuery += ' Id FROM Product2 WHERE IsActive=true' ;
    }

    @AuraEnabled
    public static Map<String, Map<String, String>> getAllObjFiedlMap() {
        Map<string,Map<String, String>> allObjFieldMap = new Map<string,Map<String, String>>();

        for(Product_Utility_Setting__mdt metaData : Product_Utility_Setting__mdt.getAll().values()){
            Map<String, String> fieldMap = new Map<String, String>();
            Map<String, Schema.SObjectField> fieldMapOfSobject = Schema.getGlobalDescribe().get(metaData.Object_API_Name__c).getDescribe().fields.getMap();

            for(String fieldName : fieldMapOfSobject.keyset()){
                if(metaData.Display_Fields__c.contains(',')){
                    for(string s : metaData.Display_Fields__c.split(',')){
                        if(s.trim() == fieldName){
                            if(metaData.DeveloperName == 'Product2'){
                                 fieldMap.put(s.trim(), fieldMapOfSobject.get(fieldName).getDescribe().getLabel() + ',' + fieldMapOfSobject.get(fieldName).getDescribe().getType());
                            } else {
                                fieldMap.put(s.trim(),fieldMapOfSobject.get(fieldName).getDescribe().getLabel());
                            }
                        }
                    }
                }
                else{
                    if(metaData.Display_Fields__c.trim() == fieldName){
                        if(metaData.DeveloperName == 'Product2'){
                            fieldMap.put(metaData.Display_Fields__c.trim(),fieldMapOfSobject.get(fieldName).getDescribe().getLabel() + ',' + fieldMapOfSobject.get(fieldName).getDescribe().getType());
                        } else {
                            fieldMap.put(metaData.Display_Fields__c.trim(),fieldMapOfSobject.get(fieldName).getDescribe().getLabel());
                        }
                    }
                }
            }
            allObjFieldMap.put(metaData.MasterLabel,fieldMap);
        }
        return allObjFieldMap;
    }


    @AuraEnabled
    public static List<ProductWrapperClass> getData(){
        try {

            List<ProductWrapperClass> productWrapperList = new List<ProductWrapperClass>();
            String productQueryString = builtProductQuery();

            for (Product2 prod : Database.query(productQueryString)) {
                productWrapperList.add(new ProductWrapperClass(prod));
            }  
            return productWrapperList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ProductWrapperClass> getFilteredData(String pricebookId){
        try {
            
            if(pricebookId == 'all'){
                return getData();
            } else {
                List<ProductWrapperClass> productWrapperList = new List<ProductWrapperClass>();
                String productQueryString = builtProductQuery();
                productQueryString = productQueryString + ' AND Id IN (SELECT Product2Id FROM PricebookEntry WHERE Pricebook2Id = \'' + pricebookId +'\')';

                System.debug(productQueryString);
                for (Product2 prod : Database.query(productQueryString)) {
                    productWrapperList.add(new ProductWrapperClass(prod));
                }  
                return productWrapperList;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class ProductWrapperClass {
        @AuraEnabled
        public Product2 prod {get;set;}
        public ProductWrapperClass(Product2 prod){
            this.prod = prod;
        }
    }
}