import 'reflect-metadata';
import express from 'express';
import * as dotenv from 'dotenv';
import { initializeCommonDatabase } from './db';
dotenv.config();
// export * from "./http-client";
// export * from "./security";
// export * from "./tracing";
const app = express();
async function bootstrap() {
    try {
        // Initialize database
        await initializeCommonDatabase();


    } catch (error) {
        console.error('Failed to start database:', error);
        process.exit(1);
    }
}