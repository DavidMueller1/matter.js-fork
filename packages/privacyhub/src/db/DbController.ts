import { Logger } from "@project-chip/matter-node.js/log";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();




export default class DbController {
    private readonly URI: string;
    private readonly client: MongoClient;
    private readonly logger: Logger = Logger.get("DbController");

    // Make it singleton
    private static _instance: DbController;

    public static getInstance = (): DbController => {
        if (!DbController._instance) {
            DbController._instance = new DbController();
        }
        return DbController._instance;
    }

    private constructor() {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not set");
        }
        this.URI = process.env.MONGO_URI;
        this.client = new MongoClient(this.URI);
    }

    connect = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            this.client.connect().then(() => {
                this.logger.info("Connected to database");
                resolve();
            }).catch((error) => {
                this.logger.error(`Failed to connect to database: ${error}`);
                reject(error);
            });
        });
    }


}