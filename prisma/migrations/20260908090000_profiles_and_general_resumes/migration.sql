PRAGMA foreign_keys=OFF;

CREATE TABLE "new_CompiledResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobDescriptionId" TEXT,
    "templateId" TEXT NOT NULL,
    "selectedFacetIds" TEXT NOT NULL DEFAULT '[]',
    "additionalSections" TEXT NOT NULL DEFAULT '{}',
    "compiledLatex" TEXT NOT NULL,
    "pdfPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompiledResume_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompiledResume_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_CompiledResume" ("id", "jobDescriptionId", "templateId", "selectedFacetIds", "additionalSections", "compiledLatex", "pdfPath", "status", "errorLog", "createdAt", "updatedAt")
SELECT "id", "jobDescriptionId", "templateId", "selectedFacetIds", "additionalSections", "compiledLatex", "pdfPath", "status", "errorLog", "createdAt", "updatedAt" FROM "CompiledResume";

DROP TABLE "CompiledResume";
ALTER TABLE "new_CompiledResume" RENAME TO "CompiledResume";

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

PRAGMA foreign_keys=ON;
