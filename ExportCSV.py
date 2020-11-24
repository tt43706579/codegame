import pandas as pd
from pymongo import MongoClient

def _connect_mongo(host, port, username, password, db):
    """ A util for making a connection to mongo """


    mongo_uri = 'mongodb://%s:%s/%s' % ( host, port, db)
    print(mongo_uri)
    conn = MongoClient(mongo_uri)

    return conn[db]


def read_mongo(db, collection, query={}, host='localhost', port=27017, username=None, password=None, no_id=True):
    """ Read from Mongo and Store into DataFrame """

    # Connect to MongoDB
    db = _connect_mongo(host=host, port=port, username=username, password=password, db=db)
    # Make a query to the specific DB and Collection
    cursor = db[collection].find({},{'username':1,'name':1,'Fscore':1,'Rscore':1,'Mscore':1,'pscore':1})
    
    print(collection)
    # Expand the cursor and construct the DataFrame
    temp=list(cursor)
    df =  pd.DataFrame(temp)
    print(temp)
    # Delete the _id
    if no_id and '_id' in df:
        del df['_id']

    return df

if __name__ == '__main__':
    dict1={},{'_id':1}
    df = read_mongo('nodetest', 'users', {}, 'localhost', 27017)
    df.to_csv('1.csv', index=False)