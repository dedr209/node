import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../schemas/user.schema";
import { UserModel } from "../models/user.model";

interface TokenPayload {
    sub: string;
    email: string;
}

const ACCESS_TOKEN_EXPIRES = 15 * 60; // seconds
const REFRESH_TOKEN_EXPIRES = 30 * 24 * 60 * 60; // seconds (~30 days)

// Updated to exactly match the laboratory instructions
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

function signAccessToken(user: { _id: string; email: string }) {
    const secret = process.env.JWT_SECRET as string;
    const payload: TokenPayload = { sub: user._id, email: user.email };
    return jwt.sign(payload, secret, { expiresIn: `${ACCESS_TOKEN_EXPIRES}s` });
}

function signRefreshToken(user: { _id: string; email: string }) {
    const secret = process.env.JWT_SECRET as string;
    const payload: TokenPayload & { jti?: string } = { sub: user._id, email: user.email };
    // Include a unique identifier to ensure token rotation produces a different token
    payload.jti = randomUUID();
    return jwt.sign(payload, secret, { expiresIn: `${REFRESH_TOKEN_EXPIRES}s` });
}

// DRY Helper Function for Token and Cookie Management
function issueTokensAndSetCookies(res: Response, user: { _id: string; email: string }) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Dynamic environment check
        sameSite: "strict" as const,
        path: "/",
    };

    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_EXPIRES * 1000,
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_EXPIRES * 1000,
    });
}

const authRouter = Router();

// Register endpoint
authRouter.post(
    "/register",
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body as { email: string; password: string };

        const existing = await UserModel.findOne({ email }).lean();
        if (existing) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const user = new UserModel({ email, password });
        const created = await user.save();

        const { password: _, ...userWithoutPassword } = created.toJSON();

        return res.status(201).json(userWithoutPassword);
    })
);

// Login endpoint
authRouter.post(
    "/login",
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body as { email: string; password: string };

        const user = await UserModel.findOne({ email });

        // Use constant-time compare and do not reveal which part failed
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyUser = user as any;
        const match = await anyUser.comparePassword(password);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate tokens and set cookies using the DRY helper
        issueTokensAndSetCookies(res, user as any);

        // Don't return tokens in body
        return res.status(200).json({});
    })
);

// Refresh endpoint - rotates refresh token
authRouter.post(
    "/refresh",
    asyncHandler(async (req, res) => {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        try {
            const secret = process.env.JWT_SECRET as string;
            const payload = jwt.verify(token, secret) as TokenPayload;
            const user = await UserModel.findById(payload.sub);

            if (!user) return res.status(401).json({ message: "Unauthorized" });

            // Generate new tokens and set cookies using the DRY helper
            issueTokensAndSetCookies(res, user as any);

            return res.status(200).json({});
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    })
);

// Logout - clear cookies
authRouter.post(
    "/logout",
    asyncHandler(async (req, res) => {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict" as const,
            path: "/",
        };

        res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);
        res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
        return res.status(204).send();
    })
);

export { authRouter };