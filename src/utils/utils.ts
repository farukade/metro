import { Request, Response } from "express";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { ToWords } from "to-words";
import {
  PaginationQueryType,
  ResponseQueryType,
} from "../interfaces/query.interface";
import numeral from "numeral";
import { logger } from "./logger";
import { promisify } from "util";
import { join, resolve } from "path";
import { readFile } from "fs";
import { compile } from "handlebars";
import { execute } from "@getvim/execute";
import { launch } from "puppeteer";
import { randomBytes } from "crypto";
import * as XLSX from "xlsx";
import { IAuthUser } from "../interfaces/auth.interface";
config();

export const prisma = new PrismaClient();
export const isProduction = () =>
  ["production", "prod"].includes(process.env.NODE_ENV);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_LIMIT = 10;

export const getEnv = (prop: string) => {
  return process.env[prop];
};

export const generateClientId = () => randomBytes(32).toString("hex");

export const getPagination = (query: PaginationQueryType) => {
  const page = query?.page ? Math.abs(Number(query.page)) : DEFAULT_PAGE;
  const limit = query?.limit
    ? Math.abs(Number(query.limit))
    : DEFAULT_PAGE_LIMIT;
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
};

export const getMeta = (query: PaginationQueryType, total: number) => {
  const { take } = getPagination(query);
  const page = query?.page ? Math.abs(Number(query.page)) : DEFAULT_PAGE;
  return {
    currentPage: page,
    totalItems: total,
    itemsPerPage: take,
    totalPages: Math.ceil(total / take),
  };
};

export const handleSuccess = (responseObject: ResponseQueryType) => {
  const { res, code, message, paging, data } = responseObject;
  const dataFound = data !== null || data?.length;
  return res.status(code || 200).json({
    success: dataFound ? true : false,
    message: dataFound ? message || "Success" : message || "No data",
    paging,
    result: data,
  });
};

export const handleBadRequest = (responseObject: ResponseQueryType) => {
  const { res, code, message, data } = responseObject;
  logger.error(message || "Unexpected error");
  return res.status(code || 400).json({
    success: false,
    message: message || "Failed",
    data,
  });
};

export const handleError = (res: Response, error: any) => {
  logger.error(error || "Unexpected error");
  return res.status(400).json({
    success: false,
    message: "Unexpected error",
  });
};

export const makePassword = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters[Math.floor(Math.random() * characters.length)];
  }
  return password;
};

export const toWords = new ToWords({
  localeCode: "en-US",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      // can be used to override defaults for the selected locale
      name: "Dollar",
      plural: "Dollar",
      symbol: "$",
      fractionalUnit: {
        name: "Cent",
        plural: "Cent",
        symbol: "",
      },
    },
  },
});

export const formatCurrencyBare = (amount: number, abs: boolean = false) => {
  if (!amount) {
    return "0.00";
  }
  return `${numeral(abs ? Math.abs(amount) : amount).format("0,0.00")}`;
};

export const formatCurrency = (
  amount: number,
  user: Partial<IAuthUser>,
  abs: boolean = false
) => {
  const defaultCurrency = { symbol: "$" };
  if (!amount) {
    return `${defaultCurrency.symbol}0.0`;
  }
  return `${defaultCurrency.symbol}${numeral(
    abs ? Math.abs(amount) : amount
  ).format("0,0.00")}`;
};

export const removeSpaces = (text: string) => {
  return text.split(" ").join("");
};

export const getPercentage = (num: number, perc: number) => {
  if (!num || isNaN(num)) {
    return 0;
  }
  if (isNaN(perc)) {
    return 0;
  }
  return (num / 100) * perc;
};

export const formatPhone = (num: string) => {
  if (num[0] === "+") {
    return num;
  } else if (num[0] === "2" && num[1] === "3" && num[2] === "4") {
    return `+${num}`;
  } else {
    let str = "+234";
    for (let i = 1; i < num.length; i++) {
      str += num[i];
    }
    return str;
  }
};

export const generatePDF = async (template: string, data: any) => {
  try {
    await serverLogin();
    const readFileInstance = promisify(readFile);
    const filepath = resolve(
      __dirname,
      `../../views/pdf_templates/${template}.hbs`
    );
    const html = await readFileInstance(filepath, "utf-8");
    const content = compile(html)(data);

    let browser;
    const os = await execute("uname");
    switch (os) {
      case "Linux":
        browser = await launch({
          executablePath: "/snap/bin/chromium",
          headless: "new",
          args: ["--no-sandbox"],
        });
        break;

      default:
        browser = await launch({
          headless: "new",
          args: ["--no-sandbox"],
        });
        break;
    }

    const page = await browser.newPage();
    await page.setContent(content);
    await page.emulateMediaType("screen");
    await page.pdf({
      path: data.filepath,
      format: "a4",
      preferCSSPageSize: true,
    });
    await browser.close();
  } catch (error) {
    logger.error(error);
  }
};

export const excludeClientId = (data) => {
  if (!data) {
    return data;
  } else {
    const { clientId, ...restData } = data;
    return restData;
  }
};

export const excludeClientIdArr = (data: any[]) => {
  if (!data.length) {
    return [];
  }

  if (Array.isArray(data[0])) {
    return data;
  }

  let result: any = [];

  for (const d of data) {
    const { clientId, ...restData } = d;
    result.push(restData);
  }
  return result;
};

export const getAllDatabaseTables = async (): Promise<string[]> => {
  try {
    const tables = await prisma.$queryRaw`
       SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `;

    const tableNames = Array.isArray(tables)
      ? tables.map((table) => table.table_name)
      : [];
    return tableNames;
  } catch (error) {
    logger.error("Error fetching table names:" + error);
  }
};

export const upperCaseAlphabets = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export const generateSheet = (payload: { filepath: string; data: any }) => {
  try {
    const { filepath, data } = payload;
    let workBook = XLSX.utils.book_new();
    let workSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workBook, workSheet);
    XLSX.writeFile(workBook, filepath);
    return filepath;
  } catch (error) {
    logger.error("XLSX ERROR:- " + error);
    return false;
  }
};

export const sheetToJson = (file: any) => {
  try {
    const finalObject: any = {};
    const filePath = file.path;
    const data = XLSX.readFile(filePath, { type: "buffer" });
    let sheet_name: any;
    data.SheetNames.forEach((sheetName) => {
      if (!sheet_name) {
        sheet_name = sheetName;
      }
      let rowObject = XLSX.utils.sheet_to_json(data.Sheets[sheetName]);
      finalObject[sheetName] = rowObject;
    });

    return finalObject[sheet_name];
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const serverLogin = async () => {
  try {
    const users = await execute("users");
    const scriptPath = join(__dirname, "../..", "login_script.sh");
    const user = getEnv("SERVER_USER");
    const password = getEnv("SERVER_PASSWORD");
    const ip = await execute("curl icanhazip.com");

    logger.info("USERS => " + users);
    logger.info("USERS ARR => " + users.split(" "));
    logger.info(
      "USERS ARR INCLUDES USERS => ",
      users.split(" ").includes(user)
    );
    logger.info("IS PRODUCTION => " + isProduction());
    logger.info("SCRIPT => " + `${scriptPath} ${user} ${ip}`);

    if (!users.split(" ").includes(user) && isProduction()) {
      execute(`${scriptPath} ${user} ${ip} ${password}`);
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
