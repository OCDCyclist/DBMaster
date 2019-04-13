# DBMaster
Emulate a distributed database and try out alternatives approaches.

DBMaster client to simulate receiving data from some arbitrary client.  See for example the companion project DataPump:

https://github.com/OCDCyclist/DataPump

DBMaster is a Node/Express application.  Express provides a simple API to start, stop, and monitor the progress of the database.

Set the port to listen on in the .env file.  Default is 4100.
Set the physical location of the two log folders.  

LOGDBPATH is for incoming data to be written to.  After the file(s) in LOGDBPATH are processed they are archived to LOGARCHIVEDBPATH.

Do not place the archive folder directly underneath the LOGDBPATH.  This simplifies some code to not have to check.

LOGDBPATH = D:\repos\DBMaster\data\logs\
LOGARCHIVEDBPATH = D:\repos\DBMaster\data\logsArchive\

After downloading run: 

npm install

npm audit fix

To run:

npm start

START in Postman or similar with this GET request.

localhost:4100/start

STOP in Postman or similar with this GET request

localhost:4100/stop

These are GET requests so that it is easy to use a browser too.




