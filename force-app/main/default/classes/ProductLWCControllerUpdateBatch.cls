public class ProductLWCControllerUpdateBatch implements Database.Batchable<sObject>, Database.Stateful{

    public ProductLWCControllerUpdateBatch(List<sObject> listNames){
        System.debug('------------BATCH CALL------------');
        SYSTEM.debug('List Name==='+listNames);
    }
    public Database.QueryLocator start(Database.BatchableContext BC)
        {
            System.debug('Start');
            // System.debug('Start query--->'+query);
            // return Database.getQueryLocator(query); 
        }
        public void execute(Database.BatchableContext BC, List<sObject> scope)
        {

        }
}