// Content script for extracting resume data from Naukri/ResDex profiles
console.log("🚀 Resume extractor content script loading...");
console.log("📍 Current URL:", window.location.href);
console.log("📍 Page title:", document.title);
console.log("📍 Document ready state:", document.readyState);

// Simple test to verify script is working
document.body.style.border = "2px solid red";
console.log("🎯 Content script test: Added red border to page");

// Check if already loaded to prevent duplicate declarations
if (typeof window.ResumeExtractorLoaded === "undefined") {
  window.ResumeExtractorLoaded = true;

  class OptimizedResumeExtractor {
    constructor() {
      this.extractedData = {};
      console.log("📋 OptimizedResumeExtractor instance created");
    }

    // Helper function to safely extract text content
    extractText(element) {
      return element ? element.textContent.trim() : "";
    }

    // Helper function to extract array of text from elements
    extractTextArray(elements) {
      return Array.from(elements)
        .map((el) => this.extractText(el))
        .filter((text) => text.length > 0);
    }

    // Main extraction function
    extractCompleteResumeData(htmlString = null) {
      // If HTML string is provided, create a temporary DOM element
      let doc = document;
      if (htmlString) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;
        doc = tempDiv;
      }

      console.log("🔍 Starting comprehensive resume data extraction...");

      const resumeData = this.extractProfileData(doc);

      // Extract header data from the new HTML structure
      const headerData = this.extractHeaderData(doc);

      // Merge headerData with resumeData
      if (headerData) {
        resumeData.header = headerData;
      }

      console.log("✅ Complete resume data extracted:", resumeData);
      return resumeData;
    }
    // NEW FUNCTION to extract data from the header HTML
    extractHeaderData(doc = document) {
      const headerData = {};
      const get_text = (selector, parent = doc) =>
        parent.querySelector(selector)?.innerText.trim() || null;

      try {
        headerData.name = get_text(".TuXA7.ellipsis");
        headerData.experience = get_text(".QY5cK [title*='y']");
        headerData.salary = get_text(".QY5cK [title*='Lacs']");
        headerData.location = get_text(".location");
        headerData.currentPosition = get_text("._0g20Z .ellipsis[title*='Sr Software engineer']");
        headerData.highestDegree = get_text("._0g20Z .ellipsis[title*='BCA']");
        headerData.email = get_text(".rL5xY.ellipsis");
        return headerData;
      } catch (error) {
        console.error("Error extracting header data:", error);
        return null;
      }
    }


    // Comprehensive Profile Data Extractor
    extractProfileData(doc = document) {
      const get_text = (selector, parent = doc) =>
        parent.querySelector(selector)?.innerText.trim() || null;
      const get_all_text = (selector, parent = doc) =>
        Array.from(parent.querySelectorAll(selector)).map((el) =>
          el.innerText.trim()
        );
      const get_all_attributes = (selector, attribute, parent = doc) =>
        Array.from(parent.querySelectorAll(selector)).map((el) =>
          el.getAttribute(attribute)
        );

      try {
        // --- Profile Summary ---
        const profile = {
          headline: get_text("blockquote.about-candidates"),
          keySkills: get_all_attributes(
            ".Mqi95 + ._8QjY0 .focusable.suggestor-tag .txt.ellipsis",
            "title"
          ),
          mayAlsoKnow: get_all_attributes(
            ".ZVSp3 .focusable.suggestor-tag .txt.ellipsis",
            "title"
          ),
        };

        // --- Work Summary ---
        const workSummary = {
          summary: get_text("._4pcQv .T74Ao"),
          industry: get_text(".s81Wd .OMOoI:nth-child(1) .cMaXa"),
          department: get_text(".s81Wd .OMOoI:nth-child(2) .cMaXa"),
          role: get_text(".s81Wd .OMOoI:nth-child(3) .cMaXa"),
        };

        // --- Work Experience ---
        const workExperience = Array.from(
          doc.querySelectorAll(
            ".work-exp > .work-exp-card, .work-exp > .gap-cont"
          )
        )
          .map((el) => {
            if (el.matches(".work-exp-card")) {
              return {
                designation: get_text(".exp-label .desig", el),
                duration: get_text(".exp-label .dates", el),
                description: get_text(".desc", el),
              };
            }
            if (el.matches(".gap-cont")) {
              return {
                type: "gap",
                duration: get_text(".gap-duration.desig", el),
                period: get_text(".gap-date.dates", el),
              };
            }
            return null;
          })
          .filter(Boolean);

        // --- Other Projects ---
        const otherProjects = Array.from(
          doc.querySelectorAll(".other-projects .exp-card")
        ).map((card) => {
          // This is a bit tricky as some classes are reused. We rely on order.
          const allExpTexts = Array.from(
            card.querySelectorAll(":scope > .exp-text")
          );
          return {
            title: get_text(".card-head .exp-text", card),
            duration: get_text(".card-head .exp-label", card),
            client:
              allExpTexts.length > 1 ? allExpTexts[1].innerText.trim() : null,
            skills: get_text(".skills.exp-text", card)?.replace("Skills: ", ""),
            roleDescription: get_text(".role-desc:not(.proj-desc)", card)
              ?.replace("Role description:", "")
              .trim(),
            projectDescription: get_text(".proj-desc", card)
              ?.replace("Project description:", "")
              .trim(),
          };
        });

        // --- Education ---
        const education = Array.from(
          doc.querySelectorAll(".cv-educ .edu-wrapper")
        ).map((edu) => ({
          degree: get_text(".desig", edu),
          type: get_text(".edu-type", edu),
          institution: get_text(".institue", edu),
        }));

        // --- Certifications ---
        const certifications = Array.from(
          doc.querySelectorAll(".certification-wrapper .certification-body")
        ).map((cert) => ({
          course: get_text(".certification-course", cert),
          vendor: get_text(".certification-vendor", cert),
        }));

        // --- IT Skills ---
        const itSkills = Array.from(
          doc.querySelectorAll("#cv-prev-it-skills .tbody .tr")
        ).map((row) => ({
          skill: get_text(".col-0 .data-cell", row),
          version: get_text(".col-1 .data-cell", row),
          lastUsed: get_text(".col-2 .data-cell", row),
          experience: get_text(".col-3 .data-cell", row),
        }));

        // --- Other Details ---
        const otherDetails = {
          languagesKnown: get_all_text(".oHpMk .ll7Em").map((lang) => {
            const parts = lang.replace(")", "").split(" (");
            const langParts = parts[0].split(" - ");
            return {
              language: langParts[0],
              proficiency: langParts[1],
              skills: `( ${parts[1]} )`,
            };
          }),
          personalDetails: {
            dateOfBirth: get_text("._3PVFm .tbody .col-0 .table-cell"),
            gender: get_text("._3PVFm .tbody .col-1 .table-cell"),
            maritalStatus: get_text("._3PVFm .tbody .col-2 .table-cell"),
            physicallyChallenged: get_text("._3PVFm .tbody .col-3 .table-cell"),
          },
          desiredJobDetails: {
            jobType: get_text(".TuBlL .tbody .col-0 .table-cell"),
            employmentStatus: get_text(".TuBlL .tbody .col-1 .table-cell"),
          },
        };

        // --- Assemble Final JSON Object ---
        return {
          profile,
          workSummary,
          workExperience,
          otherProjects,
          education,
          certifications,
          itSkills,
          otherDetails,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error extracting data:", error);
        return null;
      }
    }

    // 📝 Summary Extractor
    extractSummary(doc) {
      const summaryElement = doc.querySelector(".Mqi95.about-candidates");
      return summaryElement
        ? summaryElement.textContent.trim()
        : "Summary not found";
    }

    // 🛠️ FIXED Key Skills Extractor
    extractKeySkills(doc) {
      const skills = [];
      const skillsSection = doc.querySelector("._8QjY0");

      if (skillsSection) {
        // Get skills from the main skills section (not "May also know")
        const mainSkillsContainer = skillsSection.querySelector(
          ".hPNKf.Qu1i6 .read-more"
        );
        if (mainSkillsContainer) {
          const skillTags = mainSkillsContainer.querySelectorAll(
            ".suggestor-tag .txt.ellipsis"
          );

          skillTags.forEach((tag) => {
            const skillName =
              tag.getAttribute("title") || tag.textContent.trim();
            if (
              skillName &&
              skillName !== "+5 more" &&
              !skills.includes(skillName)
            ) {
              skills.push(skillName);
            }
          });
        }
      }

      return skills.length > 0 ? skills : ["Key skills not found"];
    }

    // 🤔 FIXED May Also Know Skills Extractor
    extractMayAlsoKnowSkills(doc) {
      const mayAlsoKnowSkills = [];
      const mayAlsoKnowSection = doc.querySelector(".ZVSp3");

      if (mayAlsoKnowSection) {
        const skillTags = mayAlsoKnowSection.querySelectorAll(
          ".suggestor-tag .txt.ellipsis"
        );

        skillTags.forEach((tag) => {
          const skillName = tag.getAttribute("title") || tag.textContent.trim();
          if (
            skillName &&
            skillName !== "+6 more" &&
            !mayAlsoKnowSkills.includes(skillName)
          ) {
            mayAlsoKnowSkills.push(skillName);
          }
        });
      }

      return mayAlsoKnowSkills.length > 0
        ? mayAlsoKnowSkills
        : ["May also know skills not found"];
    }

    // 📊 Work Summary Extractor
    extractWorkSummary(doc) {
      const workSummaryElement = doc.querySelector(".T74Ao");
      return workSummaryElement
        ? workSummaryElement.textContent.trim()
        : "Work summary not found";
    }

    // 🏢 Industry Info Extractor
    extractIndustryInfo(doc) {
      const industryInfo = {};
      const infoRows = doc.querySelectorAll(".s81Wd .OMOoI");

      infoRows.forEach((row) => {
        const label = row.querySelector(".RHIwQ")?.textContent?.trim();
        const value = row.querySelector(".cMaXa")?.textContent?.trim();
        if (label && value) {
          industryInfo[label.toLowerCase().replace(/\s+/g, "")] = value;
        }
      });

      return Object.keys(industryInfo).length > 0
        ? industryInfo
        : { error: "Industry info not found" };
    }

    // 💼 Work Experience Extractor
    extractWorkExperience(doc) {
      const experiences = [];
      const expCards = doc.querySelectorAll(".work-exp-card");

      expCards.forEach((card) => {
        const designation =
          card.querySelector(".desig")?.textContent?.trim() || "";
        const duration =
          card.querySelector(".dates span")?.textContent?.trim() || "";
        const description =
          card.querySelector(".desc")?.textContent?.trim() || "";

        if (designation) {
          experiences.push({
            designation: designation,
            duration: duration,
            description: description,
          });
        }
      });

      // Also extract career gaps
      const gaps = [];
      const gapContainers = doc.querySelectorAll(".gap-cont");

      gapContainers.forEach((gapContainer) => {
        const gapDuration = gapContainer
          .querySelector(".gap-duration")
          ?.textContent?.trim();
        const gapDate = gapContainer
          .querySelector(".gap-date")
          ?.textContent?.trim();

        if (gapDuration && gapDate) {
          gaps.push({
            type: "Career Gap",
            duration: gapDuration,
            period: gapDate,
          });
        }
      });

      return {
        experiences:
          experiences.length > 0 ? experiences : ["Work experience not found"],
        careerGaps: gaps.length > 0 ? gaps : ["No career gaps found"],
      };
    }

    // Extract career gaps
    extractCareerGaps(doc) {
      const gapElements = doc.querySelectorAll(".gap-cont");
      const gaps = [];

      gapElements.forEach((gap) => {
        const gapData = {
          duration: this.extractText(gap.querySelector(".gap-duration")),
          dates: this.extractText(gap.querySelector(".gap-date")),
        };
        gaps.push(gapData);
      });

      return gaps;
    }

    // 📂 FIXED Projects Extractor - Correct DOM targeting
    extractProjects(doc) {
      const projects = [];

      // Target the correct projects container
      const projectsSection = doc.querySelector(".other-projects");
      if (!projectsSection) {
        return [
          {
            name: "No dedicated PROJECTS section found",
            description: "",
            role: "",
            duration: "",
            techStack: "",
          },
        ];
      }

      const projectCards = projectsSection.querySelectorAll(".exp-card");

      projectCards.forEach((card) => {
        const nameElement = card.querySelector(".card-head .exp-text");
        const durationElement = card.querySelector(".card-head .exp-label");
        const roleElements = card.querySelectorAll(".exp-text");
        const skillsElement = card.querySelector(".skills.exp-text");
        const descElement = card.querySelector(".proj-desc");

        if (nameElement) {
          const name = nameElement.textContent.trim();
          const duration = durationElement
            ? durationElement.textContent.trim()
            : "";

          // Find role element (second .exp-text that's not in .card-head and not .skills)
          let role = "";
          for (let i = 0; i < roleElements.length; i++) {
            const element = roleElements[i];
            if (
              !element.closest(".card-head") &&
              !element.classList.contains("skills")
            ) {
              role = element.textContent.trim();
              break;
            }
          }

          // Extract tech stack from skills section
          let techStack = "";
          if (skillsElement) {
            const skillsText = skillsElement.textContent.trim();
            techStack = skillsText
              .replace(/^Skills:\s*/i, "")
              .replace(/,$/, "")
              .trim();
          }

          // Extract description from project description section
          let description = "";
          if (descElement) {
            description = descElement.textContent
              .trim()
              .replace(/^Project description:\s*/i, "")
              .trim();
          }

          projects.push({
            name: name,
            description: description,
            role: role,
            duration: duration,
            techStack: techStack,
          });
        }
      });

      return projects.length > 0
        ? projects
        : [
            {
              name: "No dedicated PROJECTS section found",
              description: "",
              role: "",
              duration: "",
              techStack: "",
            },
          ];
    }

    // 🎓 Education Extractor
    // 🎓 FIXED Education Extractor - Correct DOM targeting
    extractEducation(doc) {
      const education = [];

      // Target the correct education wrappers
      const eduWrappers = doc.querySelectorAll(".cv-educ .edu-wrapper");

      if (eduWrappers.length === 0) {
        return [
          {
            degree: "EDUCATION section not found",
            institution: "",
            year: "",
          },
        ];
      }

      eduWrappers.forEach((wrapper) => {
        const degreeElement = wrapper.querySelector(".edu-label .desig");
        const institutionElement = wrapper.querySelector(
          ".edu-label .dates .institue"
        );

        if (degreeElement && institutionElement) {
          // Get full degree text (includes year)
          const fullDegreeText = degreeElement.childNodes[0]
            ? degreeElement.childNodes[0].textContent.trim()
            : degreeElement.textContent.trim();
          const institution = institutionElement.textContent.trim();

          // Extract year from degree text
          const yearMatch = fullDegreeText.match(/\b(19|20)\d{2}\b/);
          const year = yearMatch ? yearMatch[0] : "";

          // Clean degree text by removing year
          let cleanDegree = fullDegreeText
            .replace(/,\s*(19|20)\d{2}/, "")
            .trim();

          education.push({
            degree: cleanDegree,
            institution: institution,
            year: year,
          });
        }
      });

      return education.length > 0
        ? education
        : [
            {
              degree: "EDUCATION section not found",
              institution: "",
              year: "",
            },
          ];
    }

    // 🏆 Certifications Extractor
    extractCertifications(doc) {
      const certifications = [];
      const certBodies = doc.querySelectorAll(".certification-body");

      certBodies.forEach((body) => {
        const course = body
          .querySelector(".certification-course")
          ?.textContent?.trim();
        if (course) {
          certifications.push(course);
        }
      });

      return certifications.length > 0
        ? certifications
        : ["Certifications not found"];
    }

    // 💻 IT Skills Extractor
    extractITSkills(doc) {
      const itSkills = [];
      const skillRows = doc.querySelectorAll("#cv-prev-it-skills .tbody .tr");

      skillRows.forEach((row) => {
        const skillCell =
          row.querySelector(".col-0 .data-cell") || row.querySelector(".col-0");
        const versionCell =
          row.querySelector(".col-1 .data-cell") || row.querySelector(".col-1");
        const lastUsedCell =
          row.querySelector(".col-2 .data-cell") || row.querySelector(".col-2");
        const expCell =
          row.querySelector(".col-3 .data-cell") || row.querySelector(".col-3");

        const skill = skillCell?.textContent?.trim();
        const version = versionCell?.textContent?.trim();
        const lastUsed = lastUsedCell?.textContent?.trim();
        const experience = expCell?.textContent?.trim();

        if (skill && skill !== "Skills") {
          itSkills.push({
            skill: skill,
            version: version === "- -" ? "N/A" : version,
            lastUsed: lastUsed === "- -" ? "N/A" : lastUsed,
            experience: experience || "N/A",
          });
        }
      });

      return itSkills.length > 0 ? itSkills : ["IT Skills not found"];
    }

    // 🌐 Languages Extractor
    extractLanguages(doc) {
      const languages = [];
      const langElements = doc.querySelectorAll(".ll7Em");

      langElements.forEach((element) => {
        const langText = element.textContent.trim();
        if (langText) {
          languages.push(langText);
        }
      });

      return languages.length > 0 ? languages : ["Languages not found"];
    }

    // 👤 Personal Details Extractor
    extractPersonalDetails(doc) {
      const personalDetails = {};
      const detailRow = doc.querySelector("._3PVFm .tbody .tr");

      if (detailRow) {
        const cells = detailRow.querySelectorAll(".td .table-cell");
        if (cells.length >= 5) {
          personalDetails.dateOfBirth = cells[0].textContent.trim();
          personalDetails.gender = cells[1].textContent.trim();
          personalDetails.maritalStatus = cells[2].textContent.trim();
          personalDetails.category = cells[3].textContent.trim();
          personalDetails.physicallyChallenged = cells[4].textContent.trim();
        }
      }

      return Object.keys(personalDetails).length > 0
        ? personalDetails
        : { error: "Personal details not found" };
    }

    // 💼 Desired Job Details Extractor
    extractDesiredJobDetails(doc) {
      const jobDetails = {};
      const jobRow = doc.querySelector(".TuBlL .tbody .tr");

      if (jobRow) {
        const cells = jobRow.querySelectorAll(".td .table-cell");
        if (cells.length >= 2) {
          jobDetails.jobType = cells[0].textContent.trim();
          jobDetails.employmentStatus = cells[1].textContent.trim();
        }
      }

      return Object.keys(jobDetails).length > 0
        ? jobDetails
        : { error: "Job details not found" };
    }

    // 🌍 Work Authorization Extractor
    extractWorkAuthorization(doc) {
      const workAuth = {};
      const workAuthRow = doc.querySelector(".work-auth .tbody .tr");

      if (workAuthRow) {
        const cell = workAuthRow.querySelector(".td .table-cell");
        if (cell) {
          workAuth.status = cell.textContent.trim();
        }
      }

      return Object.keys(workAuth).length > 0
        ? workAuth
        : { error: "Work authorization not found" };
    }

    // Wait for elements to be available
    async waitForElements() {
      console.log("⏳ Waiting for DOM elements to load...");
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        // Check for traditional stl elements
        const stl01Elements = document.querySelectorAll(".stl_01");
        const stl14Elements = document.querySelectorAll(".stl_14");
        const stl07Elements = document.querySelectorAll(".stl_07");
        const stl08Elements = document.querySelectorAll(".stl_08");

        console.log(
          `🔍 Attempt ${attempts + 1}: Found ${
            stl01Elements.length
          } stl_01 elements, ${stl14Elements.length} stl_14 elements, ${
            stl07Elements.length
          } stl_07 elements, ${stl08Elements.length} stl_08 elements`
        );

        // Check for modern HTML structure elements
        const modernElements = document.querySelectorAll(
          ".profile-width-content, .work-exp-card, .cv-educ, .cv-prev-it-skills"
        );
        console.log(`🔍 Modern elements found: ${modernElements.length}`);

        // If we have either traditional or modern elements, proceed
        if (stl01Elements.length > 0 || modernElements.length > 0) {
          console.log("✅ Resume elements found!");
          return { document: document, source: "main" };
        }

        // Debug information for traditional elements
        if (attempts === 0) {
          console.log(
            "🔍 Main document - All stl_01 elements:",
            stl01Elements.length
          );
          console.log(
            "🔍 Main document - All stl_14 elements:",
            stl14Elements.length
          );
          console.log(
            "🔍 Main document - All stl_07 elements:",
            stl07Elements.length
          );
          console.log(
            "🔍 Main document - All stl_08 elements:",
            stl08Elements.length
          );
          console.log(
            "🔍 Main document - All stl_09 elements:",
            document.querySelectorAll(".stl_09").length
          );
          console.log(
            "🔍 Main document - All stl_15 elements:",
            document.querySelectorAll(".stl_15").length
          );
          console.log(
            "🔍 Main document - All stl_16 elements:",
            document.querySelectorAll(".stl_16").length
          );
          console.log(
            "🔍 Main document - All stl_17 elements:",
            document.querySelectorAll(".stl_17").length
          );

          // Check for potential resume elements
          console.log("🔍 Checking for potential resume elements...");
          const allElements = document.querySelectorAll("*");
          const resumeKeywords = [
            "resume",
            "cv",
            "profile",
            "experience",
            "education",
            "skills",
            "work",
            "job",
            "career",
            "employment",
          ];

          allElements.forEach((el, index) => {
            if (index < 50) {
              // Check first 50 elements
              const text = el.textContent.trim().toLowerCase();
              if (
                text.length > 10 &&
                resumeKeywords.some((keyword) => text.includes(keyword))
              ) {
                console.log(
                  `🔍 Potential resume element ${index}:`,
                  el.tagName,
                  el.className,
                  text.substring(0, 100)
                );
              }
            }
          });

          // Look for elements with specific class patterns
          const classPatterns = [
            "stl",
            "resume",
            "cv",
            "profile",
            "experience",
            "education",
            "skill",
          ];
          classPatterns.forEach((pattern) => {
            const elements = document.querySelectorAll(`[class*="${pattern}"]`);
            if (elements.length > 0) {
              console.log(
                `🔍 Found elements with '${pattern}' in class:`,
                elements.length
              );
              elements.forEach((el, index) => {
                if (index < 3) {
                  console.log(
                    `🔍 ${pattern} element ${index}:`,
                    el.className,
                    el.textContent.trim().substring(0, 100)
                  );
                }
              });
            }
          });

          // Look for iframe content more thoroughly
          const iframes = document.querySelectorAll("iframe");
          iframes.forEach((iframe, index) => {
            console.log(`🔍 Iframe ${index + 1} details:`, {
              src: iframe.src,
              id: iframe.id,
              name: iframe.name,
              className: iframe.className,
              width: iframe.width,
              height: iframe.height,
            });

            try {
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              if (iframeDoc) {
                console.log(
                  `🔍 Iframe ${index + 1} document ready state:`,
                  iframeDoc.readyState
                );
                console.log(`🔍 Iframe ${index + 1} title:`, iframeDoc.title);
                console.log(
                  `🔍 Iframe ${index + 1} body content length:`,
                  iframeDoc.body ? iframeDoc.body.innerHTML.length : "no body"
                );

                if (iframeDoc.body && iframeDoc.body.innerHTML.length > 100) {
                  console.log(
                    `🔍 Iframe ${index + 1} body preview:`,
                    iframeDoc.body.innerHTML.substring(0, 500)
                  );
                }
              }
            } catch (error) {
              console.log(
                `🔍 Iframe ${index + 1} access error:`,
                error.message
              );
            }
          });
        }

        // Check if we have enough resume-related elements
        const totalResumeElements =
          stl01Elements.length +
          stl14Elements.length +
          stl07Elements.length +
          stl08Elements.length;
        if (totalResumeElements > 0) {
          console.log("✅ Resume elements found in main document!");
          return { document: document, source: "main" };
        }

        // Check iframes
        const iframeDoc = await this.injectIntoIframes();
        if (iframeDoc) {
          const iframeStl01Elements = iframeDoc.querySelectorAll(".stl_01");
          const iframeStl14Elements = iframeDoc.querySelectorAll(".stl_14");
          const iframeStl07Elements = iframeDoc.querySelectorAll(".stl_07");
          const iframeStl08Elements = iframeDoc.querySelectorAll(".stl_08");

          const iframeTotalElements =
            iframeStl01Elements.length +
            iframeStl14Elements.length +
            iframeStl07Elements.length +
            iframeStl08Elements.length;

          if (iframeTotalElements > 0) {
            console.log("✅ Resume elements found in iframe!");
            return { document: iframeDoc, source: "iframe" };
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      console.log("❌ Resume elements not found after waiting");
      return null;
    }

    // Extract personal information using precise DOM queries
    extractPersonalInfo(doc = document) {
      console.log("🔍 Extracting personal info...");
      const personalInfo = {};

      // Extract name from stl_07 and stl_08 elements
      const firstNameElement = doc.querySelector(".stl_07");
      const lastNameElement = doc.querySelector(".stl_08");

      if (firstNameElement && lastNameElement) {
        const firstName = firstNameElement.textContent.trim();
        const lastName = lastNameElement.textContent.trim();
        personalInfo.name = `${firstName} ${lastName}`
          .replace(/\s+/g, " ")
          .trim();
        console.log("✅ Extracted name:", personalInfo.name);
      }

      // Extract contact information from stl_09, stl_11, stl_13 elements
      const contactElements = doc.querySelectorAll(".stl_09, .stl_11, .stl_13");
      contactElements.forEach((element) => {
        const text = element.textContent.trim();

        // Extract phone
        const phoneMatch = text.match(/\+91-\d+/);
        if (phoneMatch && !personalInfo.phone) {
          personalInfo.phone = phoneMatch[0];
          console.log("✅ Extracted phone:", personalInfo.phone);
        }

        // Extract email
        const emailMatch = text.match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
        );
        if (emailMatch && !personalInfo.email) {
          personalInfo.email = emailMatch[0];
          console.log("✅ Extracted email:", personalInfo.email);
        }

        // Extract LinkedIn
        const linkedInMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
        if (linkedInMatch && !personalInfo.linkedIn) {
          personalInfo.linkedIn = "https://" + linkedInMatch[0];
          console.log("✅ Extracted LinkedIn:", personalInfo.linkedIn);
        }
      });

      // Extract location from stl_16 elements
      const locationElements = doc.querySelectorAll(".stl_16");
      locationElements.forEach((element) => {
        const text = element.textContent.trim();
        if (text.includes(",") && !personalInfo.location) {
          personalInfo.location = text;
          console.log("✅ Extracted location:", personalInfo.location);
        }
      });

      console.log("✅ Personal info extracted:", personalInfo);
      return personalInfo;
    }

    // Extract profile/summary using precise DOM queries
    extractProfile(doc = document) {
      console.log("🔍 Extracting profile...");
      let profile = "";

      // Find the PROFILE section
      const profileSection = doc.querySelector(".stl_14");
      if (
        profileSection &&
        profileSection.textContent.trim().includes("PROFILE")
      ) {
        console.log("✅ Found PROFILE section");

        // Get all stl_01 elements after the PROFILE header
        const allStl01Elements = doc.querySelectorAll(".stl_01");
        let inProfileSection = false;

        allStl01Elements.forEach((element) => {
          const text = element.textContent.trim();

          // Check if we're entering the PROFILE section
          if (element.querySelector(".stl_14") && text.includes("PROFILE")) {
            inProfileSection = true;
            return;
          }

          // Check if we're leaving the PROFILE section (next section header)
          if (
            inProfileSection &&
            element.querySelector(".stl_14") &&
            (text.includes("EDUCATION") ||
              text.includes("SKILLS") ||
              text.includes("EXPERIENCE"))
          ) {
            inProfileSection = false;
            return;
          }

          // Collect profile text
          if (inProfileSection && text.length > 0) {
            profile += text + " ";
          }
        });

        profile = profile.trim();
        console.log("✅ Profile extracted:", profile.substring(0, 100));
      } else {
        console.log("❌ PROFILE section not found");
        profile = "PROFILE section not found";
      }

      return profile;
    }

    // Extract education using precise DOM queries
    extractEducation(doc = document) {
      console.log("🔍 Extracting education...");
      const education = [];

      // Get all stl_01 elements
      const allStl01Elements = doc.querySelectorAll(".stl_01");
      let inEducationSection = false;
      let currentEducation = {};

      allStl01Elements.forEach((element) => {
        const text = element.textContent.trim();

        // Check if we're entering the EDUCATION section
        if (element.querySelector(".stl_14") && text.includes("EDUCATION")) {
          inEducationSection = true;
          console.log("✅ Found EDUCATION section");
          return;
        }

        // Check if we're leaving the EDUCATION section (next section header)
        if (
          inEducationSection &&
          element.querySelector(".stl_14") &&
          (text.includes("SKILLS") || text.includes("EXPERIENCE"))
        ) {
          inEducationSection = false;
          // Save the last education entry if we have one
          if (currentEducation.institution || currentEducation.degree) {
            education.push({
              degree: currentEducation.degree || "",
              institution: currentEducation.institution || "",
              year: currentEducation.year || "",
            });
            console.log("✅ Saved education entry:", currentEducation);
          }
          return;
        }

        // Extract education information
        if (inEducationSection && text.length > 0) {
          // Look for institution (stl_09 elements that are not contact info)
          if (
            element.querySelector(".stl_09") &&
            !text.includes("|") &&
            !text.includes("@") &&
            !text.includes("+91-") &&
            !text.includes("linkedin") &&
            !text.includes("–") &&
            !text.includes("-") &&
            !text.includes("to") &&
            text.length > 3 &&
            !currentEducation.institution
          ) {
            currentEducation.institution = text;
            console.log("✅ Found institution:", text);
          }

          // Look for degree (stl_15 elements that are not skills)
          if (
            element.querySelector(".stl_15") &&
            !text.includes("Languages") &&
            !text.includes("Tools") &&
            !text.includes("Key Skills") &&
            !text.includes("Databases") &&
            !text.includes("Platforms") &&
            !currentEducation.degree
          ) {
            currentEducation.degree = text;
            console.log("✅ Found degree:", text);
          }

          // Look for year (any text with year pattern)
          if (!currentEducation.year && /\b(19|20)\d{2}\b/.test(text)) {
            currentEducation.year = text;
            console.log("✅ Found year:", text);
          }

          // If we have both institution and degree, save the education entry
          if (currentEducation.institution && currentEducation.degree) {
            education.push({
              degree: currentEducation.degree,
              institution: currentEducation.institution,
              year: currentEducation.year || "",
            });
            console.log("✅ Saved education entry:", currentEducation);
            currentEducation = {};
          }
        }
      });

      // Save the last education entry if we have one
      if (currentEducation.institution || currentEducation.degree) {
        education.push({
          degree: currentEducation.degree || "",
          institution: currentEducation.institution || "",
          year: currentEducation.year || "",
        });
        console.log("✅ Saved final education entry:", currentEducation);
      }

      if (education.length === 0) {
        console.log("❌ EDUCATION section not found");
        education.push({
          degree: "EDUCATION section not found",
          institution: "",
          year: "",
        });
      }

      console.log("✅ Education extracted:", education);
      return education;
    }

    // Extract experience using precise DOM queries
    extractExperience(doc = document) {
      console.log("🔍 Extracting experience...");
      const experience = [];

      // Get all stl_01 elements
      const allStl01Elements = doc.querySelectorAll(".stl_01");
      let inExperienceSection = false;
      let currentExperience = {};
      let currentDescription = [];
      let experienceCount = 0;
      let allExperienceText = [];

      allStl01Elements.forEach((element, index) => {
        const text = element.textContent.trim();

        // Check if we're entering the EXPERIENCE section
        if (element.querySelector(".stl_14") && text.includes("EXPERIENCE")) {
          inExperienceSection = true;
          console.log("✅ Found EXPERIENCE section");
          return;
        }

        // Check if we're leaving the EXPERIENCE section (next section header)
        if (
          inExperienceSection &&
          element.querySelector(".stl_14") &&
          text.includes("ACHIEVEMENTS")
        ) {
          inExperienceSection = false;
          // Save the last experience entry if we have one
          if (currentExperience.company && currentExperience.title) {
            experience.push({
              company: currentExperience.company,
              title: currentExperience.title,
              duration: currentExperience.duration || "",
              location: currentExperience.location || "",
              description: currentDescription.join(" "),
            });
            console.log("✅ Saved final experience entry:", currentExperience);
          }
          return;
        }

        // Extract experience information
        if (inExperienceSection && text.length > 0) {
          // Collect ALL text from experience section
          allExperienceText.push(text);
          console.log("🔍 Experience text found:", text);

          // Look for company names (stl_09 elements that are company names, not contact info)
          if (
            element.querySelector(".stl_09") &&
            !text.includes("|") &&
            !text.includes("@") &&
            !text.includes("+91-") &&
            !text.includes("linkedin") &&
            !text.includes("–") &&
            !text.includes("-") &&
            !text.includes("to") &&
            text.length > 3
          ) {
            // If we have a previous experience, save it first
            if (currentExperience.company && currentExperience.title) {
              experience.push({
                company: currentExperience.company,
                title: currentExperience.title,
                duration: currentExperience.duration || "",
                location: currentExperience.location || "",
                description: currentDescription.join(" "),
              });
              console.log("✅ Saved experience entry:", currentExperience);
              experienceCount++;
            }

            // Start new experience
            currentExperience = { company: text };
            currentDescription = [];
            console.log("✅ Found company:", text);
          }

          // Look for job titles (stl_15 elements)
          if (
            element.querySelector(".stl_15") &&
            !currentExperience.title &&
            !text.includes("Languages") &&
            !text.includes("Tools") &&
            !text.includes("Key Skills") &&
            !text.includes("Databases") &&
            !text.includes("Platforms")
          ) {
            currentExperience.title = text;
            console.log("✅ Found title:", text);
          }

          // Look for locations (stl_16 elements)
          if (element.querySelector(".stl_16") && !currentExperience.location) {
            currentExperience.location = text;
            console.log("✅ Found location:", text);
          }

          // Look for duration (stl_09 elements with date patterns)
          if (
            element.querySelector(".stl_09") &&
            (text.includes("–") ||
              text.includes("-") ||
              text.includes("to") ||
              text.includes("Oct") ||
              text.includes("Jan") ||
              text.includes("Apr") ||
              text.includes("Dec") ||
              text.includes("Sep")) &&
            !currentExperience.duration
          ) {
            currentExperience.duration = text;
            console.log("✅ Found duration:", text);
          }

          // Look for description points (bullet points - stl_17 elements)
          if (element.querySelector(".stl_17")) {
            const cleanText = text.replace(/^[•\s]+/, "").trim();
            if (cleanText.length > 10) {
              currentDescription.push(cleanText);
              console.log(
                "✅ Found description point:",
                cleanText.substring(0, 50)
              );
            }
          }

          // Look for bullet points that might be in regular text (not stl_17)
          if (text.startsWith("•") && !element.querySelector(".stl_17")) {
            const cleanText = text.replace(/^[•\s]+/, "").trim();
            if (cleanText.length > 10) {
              currentDescription.push(cleanText);
              console.log("✅ Found bullet point:", cleanText.substring(0, 50));
            }
          }

          // Capture ALL other text in experience section as description
          // This is the key fix - capture everything that's not company, title, location, or duration
          if (
            !element.querySelector(".stl_14") && // Not a section header
            !element.querySelector(".stl_09") && // Not company/duration
            !element.querySelector(".stl_15") && // Not title
            !element.querySelector(".stl_16") && // Not location
            !element.querySelector(".stl_17") && // Not bullet point
            text.length > 3 && // Any meaningful text
            !text.includes("EXPERIENCE") && // Not section header
            !text.includes("ACHIEVEMENTS")
          ) {
            // Not next section
            currentDescription.push(text);
            console.log("✅ Found description text:", text.substring(0, 50));
          }
        }
      });

      // Save the last experience entry if we have one
      if (currentExperience.company && currentExperience.title) {
        experience.push({
          company: currentExperience.company,
          title: currentExperience.title,
          duration: currentExperience.duration || "",
          location: currentExperience.location || "",
          description: currentDescription.join(" "),
        });
        console.log("✅ Saved final experience entry:", currentExperience);
      }

      // If no structured experience found, create a comprehensive experience entry with ALL text
      if (experience.length === 0 && allExperienceText.length > 0) {
        console.log(
          "🔍 No structured experience found, creating comprehensive entry with all text"
        );
        console.log("🔍 All experience text found:", allExperienceText);

        // Try to extract company and title from the first few lines
        let company = "";
        let title = "";
        let duration = "";
        let location = "";
        let description = [];

        allExperienceText.forEach((text, index) => {
          if (index === 0 && text.length > 3) {
            company = text; // First line is usually company
          } else if (index === 1 && text.length > 3) {
            title = text; // Second line is usually title
          } else if (
            text.includes("–") ||
            text.includes("-") ||
            text.includes("to") ||
            text.includes("Oct") ||
            text.includes("Jan") ||
            text.includes("Apr") ||
            text.includes("Dec") ||
            text.includes("Sep")
          ) {
            duration = text;
          } else if (text.length > 5) {
            description.push(text);
          }
        });

        experience.push({
          company: company || "Company not found",
          title: title || "Title not found",
          duration: duration || "",
          location: location || "",
          description: description.join(" "),
        });
        console.log(
          "✅ Created comprehensive experience entry:",
          experience[0]
        );
      }

      // If we have experience entries but empty descriptions, try to fill them from allExperienceText
      if (experience.length > 0) {
        experience.forEach((exp, expIndex) => {
          if (!exp.description || exp.description.trim() === "") {
            console.log(
              "🔍 Empty description found for experience",
              expIndex,
              "trying to fill from all text"
            );

            // Find all text that should belong to this experience
            let experienceDescription = [];
            let foundThisExperience = false;

            allExperienceText.forEach((text) => {
              // Skip if this text is already used for company, title, location, duration
              if (
                text === exp.company ||
                text === exp.title ||
                text === exp.location ||
                text === exp.duration
              ) {
                foundThisExperience = true;
                return;
              }

              // If we found this experience and text is not used for other fields, add to description
              if (
                foundThisExperience &&
                text.length > 3 &&
                !text.includes("EXPERIENCE") &&
                !text.includes("ACHIEVEMENTS")
              ) {
                experienceDescription.push(text);
              }
            });

            if (experienceDescription.length > 0) {
              exp.description = experienceDescription.join(" ");
              console.log(
                "✅ Filled description for experience",
                expIndex,
                ":",
                exp.description.substring(0, 100)
              );
            }
          }
        });
      }

      if (experience.length === 0) {
        console.log("❌ EXPERIENCE section not found");
        experience.push({
          company: "EXPERIENCE section not found",
          title: "",
          duration: "",
          location: "",
          description: "",
        });
      }

      console.log("✅ Experience extracted:", experience);
      return experience;
    }

    // Extract skills using precise DOM queries
    extractSkills(doc = document) {
      console.log("🔍 Extracting skills...");
      const skills = [];

      // Get all stl_01 elements
      const allStl01Elements = doc.querySelectorAll(".stl_01");
      let inSkillsSection = false;

      allStl01Elements.forEach((element) => {
        const text = element.textContent.trim();

        // Check if we're entering the SKILLS section
        if (element.querySelector(".stl_14") && text.includes("SKILLS")) {
          inSkillsSection = true;
          console.log("✅ Found SKILLS section");
          return;
        }

        // Check if we're leaving the SKILLS section (next section header)
        if (
          inSkillsSection &&
          element.querySelector(".stl_14") &&
          (text.includes("EXPERIENCE") || text.includes("ACHIEVEMENTS"))
        ) {
          inSkillsSection = false;
          return;
        }

        // Extract skills from text content
        if (inSkillsSection && text.length > 0) {
          // Look for skill categories (stl_15 elements)
          if (element.querySelector(".stl_15")) {
            const skillText = text;
            console.log("🔍 Found skill category:", skillText);

            // Extract skills from the text
            const skillMatches = skillText.match(
              /[A-Za-z\s]+(?=,|\s-\s|\s\d|:)/g
            );
            if (skillMatches) {
              skillMatches.forEach((skill) => {
                const cleanSkill = skill.trim();
                if (
                  cleanSkill.length > 2 &&
                  !skills.includes(cleanSkill) &&
                  !cleanSkill.includes("Skills") &&
                  !cleanSkill.includes("Tools") &&
                  !cleanSkill.includes("Platforms") &&
                  !cleanSkill.includes("Databases") &&
                  !cleanSkill.includes("Languages")
                ) {
                  skills.push(cleanSkill);
                  console.log("✅ Found skill:", cleanSkill);
                }
              });
            }
          }

          // Also extract skills from stl_09 elements (skill descriptions)
          if (element.querySelector(".stl_09")) {
            const skillText = text;
            console.log("🔍 Found skill description:", skillText);

            // Split by commas and clean up
            const skillList = skillText.split(",").map((skill) => skill.trim());

            skillList.forEach((skill) => {
              if (
                skill.length > 2 &&
                !skills.includes(skill) &&
                !skill.includes("Skills") &&
                !skill.includes("Tools") &&
                !skill.includes("Platforms") &&
                !skill.includes("Databases") &&
                !skill.includes("Languages") &&
                !skill.includes("Key Skills")
              ) {
                skills.push(skill);
                console.log("✅ Found skill from description:", skill);
              }
            });
          }
        }
      });

      if (skills.length === 0) {
        console.log("❌ SKILLS section not found");
        skills.push("SKILLS section not found");
      }

      console.log("✅ Skills extracted:", skills);
      return skills;
    }

    // Extract achievements using precise DOM queries
    extractAchievements(doc = document) {
      console.log("🔍 Extracting achievements...");
      const achievements = [];

      // Get all stl_01 elements
      const allStl01Elements = doc.querySelectorAll(".stl_01");
      let inAchievementsSection = false;
      let allAchievementsText = [];

      allStl01Elements.forEach((element) => {
        const text = element.textContent.trim();

        // Check if we're entering the ACHIEVEMENTS section
        if (element.querySelector(".stl_14") && text.includes("ACHIEVEMENTS")) {
          inAchievementsSection = true;
          console.log("✅ Found ACHIEVEMENTS section");
          return;
        }

        // Check if we're leaving the ACHIEVEMENTS section (end of document or next section)
        if (
          inAchievementsSection &&
          element.querySelector(".stl_14") &&
          !text.includes("ACHIEVEMENTS")
        ) {
          inAchievementsSection = false;
          return;
        }

        // Extract achievement points
        if (inAchievementsSection && text.length > 0) {
          // Collect ALL text from achievements section
          allAchievementsText.push(text);
          console.log("🔍 Achievement text found:", text);

          // Look for bullet points (stl_17 elements)
          if (element.querySelector(".stl_17")) {
            const cleanText = text.replace(/^[•\s]+/, "").trim();
            if (cleanText.length > 10) {
              achievements.push(cleanText);
              console.log("✅ Found achievement:", cleanText.substring(0, 50));
            }
          }

          // Look for bullet points that might be in regular text (not stl_17)
          if (text.startsWith("•") && !element.querySelector(".stl_17")) {
            const cleanText = text.replace(/^[•\s]+/, "").trim();
            if (cleanText.length > 10) {
              achievements.push(cleanText);
              console.log(
                "✅ Found achievement bullet point:",
                cleanText.substring(0, 50)
              );
            }
          }

          // Capture ALL other text in achievements section as achievements
          // This is the key fix - capture everything that's not a section header
          if (
            !element.querySelector(".stl_14") && // Not a section header
            !element.querySelector(".stl_17") && // Not bullet point
            text.length > 5 && // Any meaningful text
            !text.includes("ACHIEVEMENTS") && // Not section header
            !text.startsWith("•")
          ) {
            // Not bullet point
            achievements.push(text);
            console.log("✅ Found achievement text:", text.substring(0, 50));
          }
        }
      });

      // If no structured achievements found, create comprehensive achievements from all text
      if (achievements.length === 0 && allAchievementsText.length > 0) {
        console.log(
          "🔍 No structured achievements found, creating comprehensive entries with all text"
        );
        console.log("🔍 All achievements text found:", allAchievementsText);

        // Use all collected text as achievements
        allAchievementsText.forEach((text) => {
          if (text.length > 5 && !text.includes("ACHIEVEMENTS")) {
            achievements.push(text);
            console.log(
              "✅ Created achievement from text:",
              text.substring(0, 50)
            );
          }
        });
      }

      if (achievements.length === 0) {
        console.log("❌ ACHIEVEMENTS section not found");
        achievements.push("ACHIEVEMENTS section not found");
      }

      console.log("✅ Achievements extracted:", achievements);
      return achievements;
    }

    // Extract projects using precise DOM queries
    extractProjects(doc = document) {
      console.log("🔍 Extracting projects...");
      const projects = [];

      // First, check if there's a dedicated PROJECTS section
      const projectsSection = doc.querySelector(".stl_14");
      let hasProjectsSection = false;
      if (
        projectsSection &&
        projectsSection.textContent.trim().includes("PROJECTS")
      ) {
        hasProjectsSection = true;
        console.log("✅ Found dedicated PROJECTS section");
      }

      // If there's no dedicated PROJECTS section, don't extract any projects
      if (!hasProjectsSection) {
        console.log(
          "❌ No dedicated PROJECTS section found - skipping project extraction"
        );
        projects.push({
          name: "No dedicated PROJECTS section found",
          description: "",
          role: "",
          duration: "",
          techStack: "",
        });
        console.log("✅ Projects extracted:", projects);
        return projects;
      }

      // Only extract projects if there's a dedicated PROJECTS section
      if (hasProjectsSection) {
        console.log("🔍 Extracting projects from dedicated PROJECTS section");

        // Get all stl_01 elements
        const allStl01Elements = doc.querySelectorAll(".stl_01");
        let inProjectsSection = false;
        let currentProject = {};
        let currentDescription = [];

        allStl01Elements.forEach((element) => {
          const text = element.textContent.trim();

          // Check if we're entering the PROJECTS section
          if (element.querySelector(".stl_14") && text.includes("PROJECTS")) {
            inProjectsSection = true;
            console.log("✅ Found PROJECTS section");
            return;
          }

          // Check if we're leaving the PROJECTS section (next section header)
          if (
            inProjectsSection &&
            element.querySelector(".stl_14") &&
            !text.includes("PROJECTS")
          ) {
            inProjectsSection = false;
            // Save the last project entry if we have one
            if (currentProject.name) {
              projects.push({
                name: currentProject.name,
                description: currentDescription.join(" "),
                role: currentProject.role || "",
                duration: currentProject.duration || "",
                techStack: currentProject.techStack || "",
              });
              console.log("✅ Saved final project entry:", currentProject);
            }
            return;
          }

          // Extract project information
          if (inProjectsSection && text.length > 0) {
            console.log("🔍 Project section text found:", text);

            // Look for project names (stl_09 elements that are project names)
            if (
              element.querySelector(".stl_09") &&
              !text.includes("|") &&
              !text.includes("@") &&
              !text.includes("+91-") &&
              !text.includes("linkedin") &&
              !text.includes("–") &&
              !text.includes("-") &&
              !text.includes("to") &&
              text.length > 3
            ) {
              // If we have a previous project, save it first
              if (currentProject.name) {
                projects.push({
                  name: currentProject.name,
                  description: currentDescription.join(" "),
                  role: currentProject.role || "",
                  duration: currentProject.duration || "",
                  techStack: currentProject.techStack || "",
                });
                console.log("✅ Saved project entry:", currentProject);
              }

              // Start new project
              currentProject = { name: text };
              currentDescription = [];
              console.log("✅ Found project name:", text);
            }

            // Look for project roles/titles (stl_15 elements)
            if (
              element.querySelector(".stl_15") &&
              !currentProject.role &&
              !text.includes("Languages") &&
              !text.includes("Tools") &&
              !text.includes("Key Skills") &&
              !text.includes("Databases") &&
              !text.includes("Platforms")
            ) {
              currentProject.role = text;
              console.log("✅ Found project role:", text);
            }

            // Look for project duration (stl_09 elements with date patterns)
            if (
              element.querySelector(".stl_09") &&
              (text.includes("–") ||
                text.includes("-") ||
                text.includes("to") ||
                text.includes("Oct") ||
                text.includes("Jan") ||
                text.includes("Apr") ||
                text.includes("Dec") ||
                text.includes("Sep")) &&
              !currentProject.duration
            ) {
              currentProject.duration = text;
              console.log("✅ Found project duration:", text);
            }

            // Look for project description points (bullet points - stl_17 elements)
            if (element.querySelector(".stl_17")) {
              const cleanText = text.replace(/^[•\s]+/, "").trim();
              if (cleanText.length > 10) {
                currentDescription.push(cleanText);
                console.log(
                  "✅ Found project description point:",
                  cleanText.substring(0, 50)
                );
              }
            }

            // Look for bullet points that might be in regular text (not stl_17)
            if (text.startsWith("•") && !element.querySelector(".stl_17")) {
              const cleanText = text.replace(/^[•\s]+/, "").trim();
              if (cleanText.length > 10) {
                currentDescription.push(cleanText);
                console.log(
                  "✅ Found project bullet point:",
                  cleanText.substring(0, 50)
                );
              }
            }

            // Capture other project description text
            if (
              !element.querySelector(".stl_14") && // Not a section header
              !element.querySelector(".stl_09") && // Not project name/duration
              !element.querySelector(".stl_15") && // Not project role
              !element.querySelector(".stl_17") && // Not bullet point
              text.length > 5 && // Any meaningful text
              !text.includes("PROJECTS")
            ) {
              // Not section header
              currentDescription.push(text);
              console.log(
                "✅ Found project description text:",
                text.substring(0, 50)
              );
            }
          }
        });

        // Save the last project entry if we have one
        if (currentProject.name) {
          projects.push({
            name: currentProject.name,
            description: currentDescription.join(" "),
            role: currentProject.role || "",
            duration: currentProject.duration || "",
            techStack: currentProject.techStack || "",
          });
          console.log("✅ Saved final project entry:", currentProject);
        }
      }

      // If no projects found in dedicated section, return empty
      if (
        projects.length === 0 ||
        (projects.length === 1 &&
          projects[0].name === "No dedicated PROJECTS section found")
      ) {
        console.log("❌ No projects found in dedicated PROJECTS section");
        projects.length = 0; // Clear the array
        projects.push({
          name: "No projects found",
          description: "",
          role: "",
          duration: "",
          techStack: "",
        });
      }

      console.log("✅ Projects extracted:", projects);
      return projects;
    }

    // Extract all resume data using optimized extractor
    async extractResumeData() {
      console.log("🔍 Starting optimized resume data extraction...");
      console.log("📄 Current URL:", window.location.href);
      console.log("📄 Page title:", document.title);

      try {
        // Use the new optimized extraction method
        const resumeData = this.extractCompleteResumeData();

        // Convert to the expected format for compatibility
        // Convert to the expected format for compatibility
        const convertedData = {
          personalInfo: resumeData.otherDetails?.personalDetails || {},
          profile: resumeData.profile?.headline || "",
          workSummary: resumeData.workSummary?.summary || "",
          industry: resumeData.workSummary?.industry || "",
          keySkills: resumeData.profile?.keySkills || [],
          mayAlsoKnowSkills: resumeData.profile?.mayAlsoKnow || [],
          education: resumeData.education || [],
          experience: resumeData.workExperience || [],
          skills: [
            ...(resumeData.profile?.keySkills || []),
            ...(resumeData.profile?.mayAlsoKnow || []),
          ],
          achievements: [], // Not available in this format
          projects: resumeData.otherProjects || [],
          certifications: resumeData.certifications || [],
          itSkills: resumeData.itSkills || [],
          languages: resumeData.otherDetails?.languagesKnown || [],
          personalDetails: resumeData.otherDetails?.personalDetails || {},
          desiredJobDetails: resumeData.otherDetails?.desiredJobDetails || {},
          modernData: resumeData, // Include the full comprehensive data
        };

        console.log(
          "✅ Optimized data extracted and converted:",
          convertedData
        );
        return convertedData;
      } catch (error) {
        console.error("❌ Error in optimized extraction:", error);
        return {
          personalInfo: {},
          profile: "",
          education: [],
          experience: [],
          skills: [],
          achievements: [],
          projects: [],
          certifications: [],
          modernData: null,
        };
      }

      const { document: doc, source } = docInfo;
      console.log("✅ Using document from:", source);

      // Check if modern HTML structure is present
      if (this.hasModernStructure(doc)) {
        console.log(
          "✅ Modern HTML structure detected, using modern extraction"
        );
        const modernData = this.extractModernResumeData(doc);

        // Convert modern data to the expected format
        const convertedData = {
          personalInfo: {
            name: "", // Not available in this format
            phone: "",
            email: "",
            linkedin: "",
            location: "",
          },
          profile: modernData.profile || modernData.workSummary || "",
          education: (modernData.education || []).map((edu) => ({
            degree: edu.degree || "",
            institution: edu.institution || "",
            year: edu.year || "",
            field: edu.specialization || "",
          })),
          experience: (modernData.experience || []).map((exp) => ({
            company: exp.title ? exp.title.split(" at ")[1] || "" : "",
            title: exp.title ? exp.title.split(" at ")[0] || exp.title : "",
            duration: exp.duration || "",
            location: "",
            description: exp.description || "",
          })),
          skills: [
            ...(modernData.keySkills || []),
            ...(modernData.mayAlsoKnow || []),
            ...(modernData.itSkills || []).map(
              (skill) => skill.skill || skill.name || ""
            ),
          ],
          achievements: [], // Not available in this format
          projects: [], // Not available in this format
          certifications: [], // Not available in this format
          modernData: modernData, // Include the full modern data
        };

        console.log("✅ Modern data extracted and converted:", convertedData);
        return convertedData;
      }

      // Use traditional extraction for stl-based resumes
      console.log("✅ Using traditional stl-based extraction");

      const personalInfo = this.extractPersonalInfo(doc);
      const profile = this.extractProfile(doc);
      const education = this.extractEducation(doc);
      const experience = this.extractExperience(doc);
      const skills = this.extractSkills(doc);
      const achievements = this.extractAchievements(doc);
      const projects = this.extractProjects(doc);
      const certifications = this.extractCertifications(doc);

      const extractedData = {
        personalInfo,
        profile,
        education,
        experience,
        skills,
        achievements,
        projects,
        certifications,
        modernData: null,
      };

      console.log("✅ Traditional data extracted:", extractedData);
      return extractedData;
    }

    // Extract certifications using precise DOM queries
    extractCertifications(doc = document) {
      console.log("🔍 Extracting certifications...");
      const certifications = [];

      // Look for certification information in the page content
      const allElements = doc.querySelectorAll("*");
      const certificationKeywords = [
        "certification",
        "certified",
        "certificate",
        "accredited",
        "license",
        "diploma",
      ];

      allElements.forEach((element) => {
        const text = element.textContent.trim();
        if (text.length > 20 && text.length < 500) {
          const lowerText = text.toLowerCase();
          const hasCertificationKeyword = certificationKeywords.some(
            (keyword) => lowerText.includes(keyword)
          );

          if (hasCertificationKeyword) {
            console.log(
              "🔍 Potential certification text:",
              text.substring(0, 100)
            );

            // Look for certification patterns
            const certPatterns = [
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Certification|Certificate|Certified))/i,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Professional|Developer|Engineer|Architect))/i,
            ];

            certPatterns.forEach((pattern) => {
              const match = text.match(pattern);
              if (match) {
                const cert = match[1];
                if (!certifications.includes(cert)) {
                  certifications.push(cert);
                  console.log("✅ Found certification:", cert);
                }
              }
            });
          }
        }
      });

      console.log("✅ Certifications extracted:", certifications);
      return certifications;
    }

    // Extract data from modern HTML structure (new format)
    extractModernResumeData(doc = document) {
      console.log("🔍 Extracting data from modern HTML structure...");

      const root = doc.querySelector(".profile-width-content");
      if (!root) {
        console.log("Modern structure root not found");
        return null;
      }

      function extractText(elem) {
        return elem ? elem.textContent.trim() : "";
      }

      // --- PROFILE SUMMARY ---
      const summary = extractText(
        root.querySelector("blockquote.about-candidates")
      );

      // --- KEY SKILLS & RELATED SKILLS ---
      const keySkills = Array.from(
        root.querySelectorAll(".oMVmh + span .suggestor-tag .txt")
      ).map((span) => extractText(span));
      const mayAlsoKnow = Array.from(
        root.querySelectorAll(".ZVSp3 .suggestor-tag .txt")
      ).map((span) => extractText(span));

      // --- WORK SUMMARY & DETAILS ---
      const workSummary = extractText(root.querySelector(".T74Ao"));
      const workDetails = Array.from(root.querySelectorAll(".s81Wd .OMOoI"))
        .map((div) => {
          const label = extractText(div.querySelector(".RHIwQ"));
          const value = extractText(div.querySelector(".cMaXa"));
          return { [label]: value };
        })
        .reduce((a, b) => Object.assign(a, b), {});

      // --- WORK EXPERIENCE (FILLED FOR ALL CARDS) ---
      const workExpCards = Array.from(
        root.querySelectorAll(".work-exp-card")
      ).map((card) => {
        return {
          title: extractText(card.querySelector(".desig")),
          duration: extractText(card.querySelector(".dates span")),
          description: extractText(card.querySelector(".desc")),
          logo: card.querySelector("img")?.getAttribute("src") || null,
        };
      });

      // --- CAREER GAPS ---
      const gapElems = Array.from(root.querySelectorAll(".gap-cont"));
      const gaps = gapElems.map((gap) => ({
        gapText: extractText(gap.querySelector(".gap-duration")),
        gapDates: extractText(gap.querySelector(".gap-date")),
      }));

      // --- EDUCATION ---
      const educationItems = Array.from(
        root.querySelectorAll(".cv-educ .edu-head")
      ).map((edu) => {
        const degreeLine = extractText(edu.querySelector(".desig"));
        const [degree, subject, yearWithType] = degreeLine.split(",");
        const eduType = edu.querySelector(".edu-type")?.textContent.trim();
        const institution = extractText(edu.querySelector(".institue"));
        // Parse year
        let year = "";
        if (yearWithType) {
          year = yearWithType.replace(/\D*(\d{4})\D*/, "$1");
        }
        return {
          degree: (degree || "").trim(),
          specialization: (subject || "").trim(),
          year: year,
          type: (eduType || "").trim(),
          institution: institution,
        };
      });

      // --- IT SKILLS TABLE ---
      const itSkills = Array.from(
        root.querySelectorAll(".cv-prev-it-skills .tbody .tr")
      )
        .map((row) => {
          const tds = row.querySelectorAll(".td");
          return {
            skill: extractText(tds[0]?.querySelector(".skills")),
            version:
              extractText(tds[1]?.querySelector(".version")) ||
              extractText(tds[1]),
            lastUsed:
              extractText(tds[2]?.querySelector(".lastUsed")) ||
              extractText(tds[2]),
            experience:
              extractText(tds[3]?.querySelector(".exp")) || extractText(tds[3]),
          };
        })
        .filter((row) => row.skill); // Remove empty rows

      // --- LANGUAGES KNOWN ---
      const languages = Array.from(root.querySelectorAll(".oHpMk .ll7Em")).map(
        (div) => {
          const [nameLevel, details] = div.textContent.split("(");
          const [name, level] = nameLevel.replace(/\s+$/, "").split(" - ");
          return {
            language: (name || "").trim(),
            proficiency: (level || "").trim(),
            skills: details
              ? details.replace(")", "").replace(/,/g, "").trim().split(" ")
              : [],
          };
        }
      );

      // --- PERSONAL DETAILS (from table) ---
      const personalDetailsRow = root.querySelector(
        ".b3iaN .details-prev .tbody .tr"
      );
      let personalDetails = {};
      if (personalDetailsRow) {
        const cells = personalDetailsRow.querySelectorAll(".table-cell");
        personalDetails = {
          dateOfBirth: extractText(cells[0]),
          gender: extractText(cells[1]),
          maritalStatus: extractText(cells[2]),
          category: extractText(cells[3]),
          physicallyChallenged: extractText(cells[4]),
        };
      }

      // --- JOB PREFERENCE ---
      const jobPrefRow = root.querySelector(".TuBlL .details-prev .tbody .tr");
      let jobPreference = {};
      if (jobPrefRow) {
        const jcells = jobPrefRow.querySelectorAll(".table-cell");
        jobPreference = {
          jobType: extractText(jcells[0]),
          employmentStatus: extractText(jcells[1]),
        };
      }

      // --- AGGREGATE AND OUTPUT ---
      const result = {
        summary,
        workSummary,
        workDetails,
        keySkills,
        mayAlsoKnow,
        experience: workExpCards,
        careerGaps: gaps,
        education: educationItems,
        itSkills,
        languages,
        personalDetails,
        jobPreference,
      };

      console.log("✅ Extracted modern resume data:", result);
      return result;
    }

    // Check if modern HTML structure is present
    hasModernStructure(doc = document) {
      const modernElements = doc.querySelectorAll(
        ".profile-width-content, .work-exp-card, .cv-educ, .cv-prev-it-skills"
      );
      return modernElements.length > 0;
    }
  }

  // Create global instance
  let resumeExtractor = null;

  // Initialize function
  function initializeExtractor() {
    console.log("🔧 Initializing OptimizedResumeExtractor...");
    if (!resumeExtractor) {
      resumeExtractor = new OptimizedResumeExtractor();
    }
    return resumeExtractor;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtractor);
  } else {
    initializeExtractor();
  }

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("🔔 Message received:", request);

    if (request.action === "extractResume") {
      try {
        const extractor = resumeExtractor || initializeExtractor();

        // Make the extraction async
        extractor
          .extractResumeData()
          .then((data) => {
            if (data) {
              // --- LOGGING ADDED HERE ---
              console.log("--- FINAL EXTRACTED RESUME DATA ---");
              console.log(JSON.stringify(data, null, 2));
              // --- END OF ADDED LOGGING ---

              console.log("✅ Sending extracted data to popup");
              sendResponse({ success: true, data: data });
            } else {
              console.log("❌ No data extracted");
              sendResponse({
                success: false,
                error: "No data could be extracted",
              });
            }
          })
          .catch((error) => {
            console.error("❌ Error in extraction:", error);
            sendResponse({ success: false, error: error.message });
          });

        // Return true to indicate we'll send response asynchronously
        return true;
      } catch (error) {
        console.error("❌ Error in message listener:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
  });

  console.log(
    "✅ Resume extractor content script loaded successfully on:",
    window.location.href
  );
} else {
  console.log(
    "🔄 Resume extractor already loaded, skipping duplicate initialization"
  );
}
