import { Response, Router } from "express";
import { AuthRequest } from "../types/AuthRequest.type";
import {
  updateAllQuestions,
  viewTeams,
  viewUsers,
} from "../controllers/admin.controller";
import { readCsv, Record } from "../controllers/verify.controllers";
import { prisma } from "..";
const router = Router();

router.get("/update", async (req: AuthRequest, res: Response) => {
  try {
    await updateAllQuestions();
    return res.json({ message: "Updated" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await viewUsers());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/users/count", async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json({ count: users.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/teams", async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await viewTeams());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/teams/count", async (req: AuthRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany();
    return res.json({ count: teams.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/count", async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany();
    return res.json({ count: submissions.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/accuracy", async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany();
    const correct = submissions.filter((sub) => sub.isCorrect).length;
    const percentage = (correct / submissions.length) * 100;
    // convert to 2 decimal places
    return res.json({ accuracy: percentage.toFixed(2) });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/analysis", async (req: AuthRequest, res: Response) => {
  try {
    // rank question groups by number of submissions
    const submissions = await prisma.submission.findMany();
    const questionGroups = await prisma.questionGroup.findMany();
    const questionGroupSubmissions = questionGroups.map((group) => {
      const groupSubmissions = submissions.filter(
        (sub) => sub.questionGroupId === group.id
      );
      const percentageCorrect = (
        (groupSubmissions.filter((sub) => sub.isCorrect).length /
          groupSubmissions.length) *
        100
      ).toFixed(2);
      return {
        id: group.id,
        name: group.name,
        submissions: groupSubmissions.length,
        percentageCorrect,
      };
    });

    // sort by number of submissions
    questionGroupSubmissions.sort((a, b) => b.submissions - a.submissions);
    return res.json(questionGroupSubmissions);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/whitelistupdate", async (req, res) => {
  try {
    const users: Record[] = await readCsv();
    await prisma.whitelist.createMany({
      data: users.map((v) => ({
        email: v.email,
      })),
      skipDuplicates: true,
    });

    return res.status(200).json({ message: "done" });
  } catch (error) {
    return res.sendStatus(500);
  }
});
export default router;
