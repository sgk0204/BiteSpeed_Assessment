"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identify = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const identify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phoneNumber } = req.body;
        const emailStr = email ? String(email) : null;
        const phoneStr = phoneNumber ? String(phoneNumber) : null;
        if (!emailStr && !phoneStr) {
            res.status(400).json({ error: "Email or phoneNumber is required" });
            return;
        }
        // 1. Find directly matching contacts
        const matchingContacts = yield prisma.contact.findMany({
            where: {
                OR: [
                    { email: emailStr !== null && emailStr !== void 0 ? emailStr : undefined },
                    { phoneNumber: phoneStr !== null && phoneStr !== void 0 ? phoneStr : undefined }
                ]
            }
        });
        if (matchingContacts.length === 0) {
            // Create new primary contact
            const newContact = yield prisma.contact.create({
                data: {
                    email: emailStr,
                    phoneNumber: phoneStr,
                    linkPrecedence: "primary"
                }
            });
            res.status(200).json({
                contact: {
                    primaryContatctId: newContact.id,
                    emails: newContact.email ? [newContact.email] : [],
                    phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
                    secondaryContactIds: []
                }
            });
            return;
        }
        // 2. Identify all related Primary IDs to fetch the entire cluster(s)
        const primaryIds = new Set();
        for (const contact of matchingContacts) {
            if (contact.linkedId) {
                primaryIds.add(contact.linkedId);
            }
            else {
                primaryIds.add(contact.id);
            }
        }
        // Fetch the full cluster(s) based on primary IDs
        let clusterContacts = yield prisma.contact.findMany({
            where: {
                OR: [
                    { id: { in: Array.from(primaryIds) } },
                    { linkedId: { in: Array.from(primaryIds) } }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        // 3. Find the oldest primary contact in the cluster
        const primaries = clusterContacts.filter((c) => c.linkPrecedence === "primary");
        primaries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const rootPrimary = primaries[0];
        // If there are multiple primary contacts in the cluster, we need to merge them
        if (primaries.length > 1) {
            const otherPrimaryIds = primaries.slice(1).map((p) => p.id);
            // Update other primaries to be secondary and link to rootPrimary
            yield prisma.contact.updateMany({
                where: { id: { in: otherPrimaryIds } },
                data: {
                    linkPrecedence: "secondary",
                    linkedId: rootPrimary.id,
                    updatedAt: new Date()
                }
            });
            // Update their children to link to rootPrimary
            yield prisma.contact.updateMany({
                where: { linkedId: { in: otherPrimaryIds } },
                data: {
                    linkedId: rootPrimary.id,
                    updatedAt: new Date()
                }
            });
            // Refetch the cluster to have updated relationships
            clusterContacts = yield prisma.contact.findMany({
                where: {
                    OR: [
                        { id: rootPrimary.id },
                        { linkedId: rootPrimary.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });
        }
        // 4. Check if we need to create a new secondary contact
        // A secondary contact is created if the incoming request has NEW information
        // (an email or phone that doesn't exist in the current cluster at all)
        // but at least one of them matched (which we know is true because matchingContacts.length > 0)
        // BUT we only create if something is NEW. If BOTH email and phone already exist mapped to this cluster, no new contact is needed.
        const clusterEmails = new Set(clusterContacts.map((c) => c.email).filter(Boolean));
        const clusterPhones = new Set(clusterContacts.map((c) => c.phoneNumber).filter(Boolean));
        let createdNewContact = false;
        if ((emailStr && !clusterEmails.has(emailStr)) ||
            (phoneStr && !clusterPhones.has(phoneStr))) {
            // The incoming payload has at least one piece of new info
            const newSecondary = yield prisma.contact.create({
                data: {
                    email: emailStr,
                    phoneNumber: phoneStr,
                    linkedId: rootPrimary.id,
                    linkPrecedence: "secondary"
                }
            });
            clusterContacts.push(newSecondary);
            createdNewContact = true;
        }
        // 5. Build response payload
        const finalEmails = new Set();
        const finalPhones = new Set();
        const secondaryIds = [];
        // Ensure the primary contact's info comes first
        if (rootPrimary.email)
            finalEmails.add(rootPrimary.email);
        if (rootPrimary.phoneNumber)
            finalPhones.add(rootPrimary.phoneNumber);
        for (const contact of clusterContacts) {
            if (contact.email)
                finalEmails.add(contact.email);
            if (contact.phoneNumber)
                finalPhones.add(contact.phoneNumber);
            if (contact.id !== rootPrimary.id) {
                secondaryIds.push(contact.id);
            }
        }
        res.status(200).json({
            contact: {
                primaryContatctId: rootPrimary.id, // typo in PDF verbatim "primaryContatctId" expected
                emails: Array.from(finalEmails),
                phoneNumbers: Array.from(finalPhones),
                secondaryContactIds: secondaryIds
            }
        });
    }
    catch (error) {
        console.error("Error in /identify:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.identify = identify;
