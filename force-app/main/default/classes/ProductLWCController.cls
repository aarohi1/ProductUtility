public with sharing class ProductLWCController {

    private static String builtProductQuery(){
        String productQuery = 'SELECT ';

        Product_Utility_Setting__mdt productMetaData = Product_Utility_Setting__mdt.getInstance('Product2');
        productQuery += productMetaData.Display_Fields__c + ',';

        Product_Utility_Setting__mdt priceMetaData = Product_Utility_Setting__mdt.getInstance('PricebookEntry');
        productQuery += '(SELECT Id,' + priceMetaData.Display_Fields__c + ' FROM ' + priceMetaData.Child_Relationship_Name__c + ' WHERE isActive = True AND Pricebook2.isActive = TRUE),'; 

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
            List<ProductWrapperClass> productWrapperList = new List<ProductWrapperClass>();
            String productQueryString = builtProductQuery();
            List<Product2> prodList = Database.query(productQueryString);
            if(!prodList.isEmpty()){
                for (Product2 prod : prodList ) {
                    productWrapperList.add(new ProductWrapperClass(prod));
                }
            }
            return productWrapperList;
    }

    @AuraEnabled
    public static List<ProductWrapperClass> getFilteredData(String pricebookId){
        if(pricebookId == 'all'){
            return getData();
        } else {
            List<ProductWrapperClass> productWrapperList = new List<ProductWrapperClass>();
            String productQueryString = builtProductQuery();
            productQueryString = productQueryString + ' AND Id IN (SELECT Product2Id FROM PricebookEntry WHERE Pricebook2Id = \'' + pricebookId +'\')';
            List<Product2> prodList = Database.query(productQueryString);
            if(!prodList.isEmpty()){
                for (Product2 prod : prodList) {
                    productWrapperList.add(new ProductWrapperClass(prod));
                } 
            }
            return productWrapperList; 
        }
    } 

    @AuraEnabled
    public static string updateProduct(String filterPriceBookId, Double rate, String operatorValue, List<String> selectedProdId ) {
        System.debug('filterPriceBookId==>'+filterPriceBookId);
        System.debug('rate==>'+rate);
        System.debug('operatorValue==>'+operatorValue);
        System.debug('selectedProdId==>'+selectedProdId);

        String message = '';
        
        String updateProductQuery = builtProductQuery() + ' and Id IN: selectedProdId';
        List<PricebookEntry> updatePricebookentryList = new List<PricebookEntry>();
        Map<Id,PricebookEntry> priceBookMap = new Map<Id,PricebookEntry>();
        List<Product2> productList = Database.query(updateProductQuery);
        System.debug('productList ===>'+productList);
        try{
            if(!productList.isEmpty()){
                Update_Tracking__c UT= new Update_Tracking__c();
                UT.Status__c = 'In Progress';
                insert UT;

                String recsJSON = JSON.serialize(productList);
                Attachment jsonfile = new Attachment();  
                jsonfile.ParentId = UT.Id;
                jsonfile.Name = 'Products ' + string.valueOf(system.now());	
                jsonfile.ContentType = 'text/plain';
                jsonfile.Body = Blob.valueOf(recsJSON);

                for(Product2 prod: productList){
                //     priceBookMap.put(prod.Id,prod.pricebookentries);
                // }
                    for(PricebookEntry pbe: prod.pricebookentries){
                        if(operatorValue == '+'){ 
                            if(filterPriceBookId == 'all'){
                                pbe.unitprice = pbe.unitprice + (pbe.unitprice * (rate / 100)) ; 
                            }else if(pbe.PriceBook2Id == filterPriceBookId){
                                pbe.unitprice = pbe.unitprice + (pbe.unitprice * (rate / 100)) ; 
                            }
                        }else{ 
                            if(filterPriceBookId == 'all'){
                                pbe.unitprice = pbe.unitprice - (pbe.unitprice * (rate/ 100)) ; 
                            }else if(pbe.PriceBook2Id == filterPriceBookId){
                                pbe.unitprice = pbe.unitprice - (pbe.unitprice * (rate / 100)) ; 
                            }
                        }
                        updatePricebookentryList.add(pbe);
                    }
                }
                if(jsonfile!=null){
                    insert jsonfile;
                }       
            }
            if(!updatePricebookentryList.isEmpty()){
                update updatePricebookentryList;
                message = 'Update Successfully';
            }
        }catch (Exception e) {
            message = 'Unsuccess';
            throw new AuraHandledException(e.getMessage());
        }
        return message;
    }

    /*
      revert logic in custom object and line items 
    */

  // @AuraEnabled
    // public static string revertProduct(){
    //     List<Update_Tracking__c> UTList = [select id from Update_Tracking__c order by createdDate desc limit 1];
    //     List<PricebookEntry> PBEList = new List<PricebookEntry>();
    //     for(Update_Tracking_line_Item__c UTLineItems : [select id,PriceBookEntryId__c,Object_API_Name__c,ProductId__c,Old_Value__c,Update_Tracking__c from Update_Tracking_line_Item__c where Update_Tracking__r.ID IN: UTList]){
    //         PricebookEntry pricebook = new PricebookEntry();
    //         pricebook.Id = UTLineItems.PriceBookEntryId__c;
    //        // pricebook.pricebook2Id = UTLineItems.ProductId__c;
    //         pricebook.unitprice = UTLineItems.Old_Value__c;
    //         PBEList.add(pricebook);

    //     }
    //     update PBEList;
    //     return 'REVERT Successfuly';
    // }

    /*
      revert logic in cutom object and Attachments 
    */
    @AuraEnabled
    public static string revertProduct(){
        string prodUtilSavepointId = '';
        list<sObject> listToUpdate = new list<sObject>();
        list<string> productIdList = new list<string>();
        list<PricebookEntry> PBEList = new List<PricebookEntry>();
        map<string,list<sObject>> recordsMap = new map<string,List<sObject>>();
        String message ='';
        try{
            list<Update_Tracking__c> UTList = new list<Update_Tracking__c>([select id,Status__c from Update_Tracking__c order by createdDate desc limit 1]);
            if(!UTList.isEmpty() && UTList[0].Status__c != 'Reverted'){
                prodUtilSavepointId = UTList[0].id;
                UTList[0].Status__c = 'Reverted';
                update UTList;
                list<attachment> attachmentList = [select Id,Name,Body,ContentType from attachment where parentId =: UTList[0].id];
                for(attachment spAttach : attachmentList){
                    if(spAttach.Name.contains('Products')){
                        for(sObject product : (list<sObject>)JSON.deserialize(spAttach.Body.tostring(), list<sObject>.class)){
                            productIdList.add(String.valueOf(product.get('Id')));
                        }
                    }
                }
                for(attachment spAttach : attachmentList){
                    if(spAttach.Body.tostring() != null && spAttach.Body.tostring() != ''){
                        if(spAttach.Name.contains('Products')){
                            for(sObject product : (list<sObject>)JSON.deserialize(spAttach.Body.tostring(), list<sObject>.class)){
                                if(!recordsMap.containsKey('Product2')){
                                    recordsMap.put('Product2',new list<sObject>{product});
                                }
                                else{
                                    list<sObject> tempList = recordsMap.get('Product2');
                                    tempList.add(product);
                                    recordsMap.put('Product2',tempList);
                                }
                            }
                            for(string keyName : recordsMap.keyset()){
                                listtoupdate.addall(recordsMap.get(keyName));
                            }
                        }
                    }
                }
                for(sObject prod: listtoupdate){ 
                    for(sObject pbes : prod.getSObjects('PricebookEntries')){
                        PricebookEntry price = new PricebookEntry();
                        price.Id = (Id)pbes.get('Id');
                        price.unitprice = (double)pbes.get('UnitPrice');
                        PBEList.add(price);
                    }
                }
                if(!PBEList.isEmpty()){
                    message = 'Success';
                    update PBEList;
                }
            }else if(UTList[0].Status__c == 'Reverted'){
                    message = 'Already Reverted';
            }        
        }
        catch (Exception e) {
            message = 'Unsuccess';
            throw new AuraHandledException(e.getMessage());
        }
        return message;
    }

    @AuraEnabled
    public static boolean revertDisabled(){
        boolean isReverted = false;
        list<Update_Tracking__c> UTList = new list<Update_Tracking__c>([select id,Status__c from Update_Tracking__c order by createdDate desc limit 1]);
        if(!UTList.isEmpty() && UTList[0].Status__c =='Reverted'){
            isReverted = true;
        }
        else{
            isReverted = false;
        }
        return isReverted;
    }
    public class ProductWrapperClass {
        @AuraEnabled
        public Product2 prod {get;set;}
        public ProductWrapperClass(Product2 prod){
            this.prod = prod;
        }
    }
}