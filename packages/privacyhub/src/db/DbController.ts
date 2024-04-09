import { Logger } from "@project-chip/matter-node.js/log";
import { MongoClient } from "mongodb";


export default class DbController {
    private readonly URI: string;
    private readonly client: MongoClient;
    private readonly logger: Logger = Logger.get("DbController");

    constructor(URI: string) {
        this.URI = URI;
        this.client = new MongoClient(URI);
    }

    connect = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            this.client.connect().then(() => {
                this.logger.info("Connected to database");
                this.client.db("devices").command({ ping: 1 }).then(() => {
                    this.logger.debug("Ping successful");
                    resolve();
                }).catch((error) => {
                    this.logger.error(`Ping failed: ${error}`);
                    reject(error);
                });
            }).catch((error) => {
                this.logger.error(`Failed to connect to database: ${error}`);
                reject(error);
            });
        });
    }
}