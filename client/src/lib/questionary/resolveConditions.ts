/* eslint-disable @typescript-eslint/no-explicit-any */
const ResolveConditions = (questions: Array<any>) => {
  return questions.map((q: any) => {
    if (q.conditions && q.conditions.length > 0) {
      const resolve = mainCondition(q, questions);
      return {
        ...q,
        skip_validation: !resolve,
      };
    }
    return {
      ...q,
      skip_validation: false,
    };
  });
};

const safeString = (value: unknown) => String(value ?? "");

const mainCondition = (question: any, allQuestions: Array<any>) => {
  let isVisible = false;
  const conditions = [...(question.conditions || [])].sort(
    (a: any, b: any) => (a.priority ?? 0) - (b.priority ?? 0),
  );
  const resolveRuleAction = (rule: any) => {
    const checkQuestion = allQuestions.find(
      (q: any) => q.order === rule.question_order,
    );
    if (!checkQuestion) return false;
    const response = checkQuestion.response;

    if (rule.operator === "equals") {
      return safeString(response).toLowerCase() === safeString(rule.value).toLowerCase();
    }
    if (rule.operator === "not_equals") {
      return safeString(response).toLowerCase() !== safeString(rule.value).toLowerCase();
    }
    if (rule.operator === "greater_than") {
      return Number(response) > Number(rule.value);
    }
    if (rule.operator === "less_than") {
      return Number(response) < Number(rule.value);
    }
    if (rule.operator === "greater_than_or_equal") {
      return Number(response) >= Number(rule.value);
    }
    if (rule.operator === "less_than_or_equal") {
      return Number(response) <= Number(rule.value);
    }
    if (rule.operator === "between") {
      return (
        Number(response) >= Number(rule.value[0]) &&
        Number(response) <= Number(rule.value[1])
      );
    }
    if (rule.operator === "not_between") {
      return (
        Number(response) < Number(rule.value[0]) ||
        Number(response) > Number(rule.value[1])
      );
    }
    if (rule.operator === "contains") {
      return safeString(response).toLowerCase().includes(safeString(rule.value).toLowerCase());
    }
    if (rule.operator === "not_contains") {
      return !safeString(response)
        .toLowerCase()
        .includes(safeString(rule.value).toLowerCase());
    }
    if (rule.operator === "starts_with") {
      return safeString(response).toLowerCase().startsWith(safeString(rule.value).toLowerCase());
    }
    if (rule.operator === "ends_with") {
      return safeString(response).toLowerCase().endsWith(safeString(rule.value).toLowerCase());
    }
    if (rule.operator === "matches_regex") {
      return new RegExp(rule.value).test(safeString(response));
    }
    if (rule.operator === "not_matches_regex") {
      return !new RegExp(rule.value).test(safeString(response));
    }
    if (rule.operator === "is_empty") {
      return response === "";
    }
    if (rule.operator === "not_empty") {
      return response !== "";
    }
    if (rule.operator === "is_null") {
      return response === null;
    }
    if (rule.operator === "not_null") {
      return response !== null;
    }
    if (rule.operator === "in_array") {
      return Array.isArray(rule.value) && rule.value.includes(response);
    }
    if (rule.operator === "not_in_array") {
      return Array.isArray(rule.value) && !rule.value.includes(response);
    }
    if (rule.operator === "all_in_array") {
      return (
        Array.isArray(rule.value) &&
        Array.isArray(response) &&
        rule.value.every((item: any) => response.includes(item))
      );
    }
    if (rule.operator === "any_in_array") {
      return (
        Array.isArray(rule.value) &&
        Array.isArray(response) &&
        rule.value.some((item: any) => response.includes(item))
      );
    }
    if (rule.operator === "length_equals") {
      const responseLength = Array.isArray(response)
        ? response.length
        : safeString(response).length;
      return responseLength === Number(rule.value);
    }
    if (rule.operator === "length_greater") {
      const responseLength = Array.isArray(response)
        ? response.length
        : safeString(response).length;
      return responseLength > Number(rule.value);
    }
    if (rule.operator === "length_less") {
      const responseLength = Array.isArray(response)
        ? response.length
        : safeString(response).length;
      return responseLength < Number(rule.value);
    }
    if (rule.operator === "length_between") {
      const responseLength = Array.isArray(response)
        ? response.length
        : safeString(response).length;
      return (
        responseLength >= Number(rule.value[0]) &&
        responseLength <= Number(rule.value[1])
      );
    }
    if (rule.operator === "date_after") {
      return new Date(response) > new Date(rule.value);
    }
    if (rule.operator === "date_before") {
      return new Date(response) < new Date(rule.value);
    }
    if (rule.operator === "date_between") {
      const responseDate = new Date(response);
      return (
        responseDate >= new Date(rule.value[0]) &&
        responseDate <= new Date(rule.value[1])
      );
    }
    if (rule.operator === "date_equals") {
      return new Date(response).getTime() === new Date(rule.value).getTime();
    }
    if (rule.operator === "file_uploaded") {
      return Boolean(
        response?.frontal?.length > 0 ||
          response?.back?.length > 0 ||
          response?.side?.length > 0,
      );
    }
    if (rule.operator === "file_not_uploaded") {
      return !(
        response?.frontal?.length > 0 ||
        response?.back?.length > 0 ||
        response?.side?.length > 0
      );
    }
    if (rule.operator === "file_size_greater") {
      const fileSize = response?.size || response?.fileSize || 0;
      return fileSize > rule.value;
    }
    if (rule.operator === "file_size_less") {
      const fileSize = response?.size || response?.fileSize || 0;
      return fileSize < rule.value;
    }
    return false;
  };

  conditions.forEach((condition: any) => {
    const results = (condition.rules || []).map((rule: any) =>
      resolveRuleAction(rule),
    );
    const actionType = condition.actions?.[0]?.type;
    if (condition.logic === "AND") {
      if (results.every((result: any) => result === true)) {
        if (actionType === "show") isVisible = true;
      } else if (actionType === "hide") {
        isVisible = true;
      }
    }
    if (condition.logic === "OR") {
      if (results.some((result: any) => result === true) && actionType === "show") {
        isVisible = true;
      }
    }
  });

  return isVisible;
};

export default ResolveConditions;
