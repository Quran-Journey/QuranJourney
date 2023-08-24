const { Result, simpleValidation } = require("../../../utils/validation");
const root = require("./root");

/**
 *  @schema VerseWordMeaning
 *  type: object
 *  required:
 *      - index_id
 *      - word_id
 *      - word
 *      - root_id
 *      - rootword
 *      - meanings
 *  properties:
 *      index_id:
 *          type: integer
 *          description: the index of the verse in the quran
 *          example: 1
 *      word_id:
 *          type: integer
 *          description: the id pertaining to a specific word in the verse
 *          example: 2000
 *      word:
 *          type: string
 *          description: a specific word in the verse
 *          example: بِسْمِ
 *      root_id:
 *          type: integer
 *          description: the id of the root word associated with the specific word in the verse
 *          example: 936
 *      rootword:
 *          type: integer
 *          description: string representaiton of the root word with spaces in between each letter.
 *          example: س م و
 *      meanings:
 *          type: array
 *          items:
 *              $ref: '#/definitions/RootMeaning'
 *          description: the meanings associated with the word in the verse
 */

/**
 *  @schema RootMeaning
 *  type: object
 *  required:
 *      - meaning_id
 *      - root_id
 *      - meaning
 *  properties:
 *      meaning_id:
 *          type: integer
 *          description: the id of the meaning
 *          example: 1
 *      root_id:
 *          type: integer
 *          description: the id of the root word
 *          example: 936
 *      meaning:
 *          type: string
 *          description: The meaning.
 *          example: A name
 */

// To be used when adding the different meanings to the sentences.
async function getRootWordMeanings(data) {
    var invalid = simpleValidation(data, {
        root_id: "integer",
    });
    if (invalid) {
        return invalid;
    }
    let sql = "SELECT * FROM RootMeaning WHERE root_id=$1;";
    var params = [data.root_id];
    return await validate.retrieve(
        sql,
        params,
        new constants.Messages({
            success: `Successfully fetched roots for verse with id ${data.verse_id}.`,
        })
    );
}

async function getVerseRootWordsSentences(data) {
    var all_roots = await root.getVerseRootWords(data);
    let msg = all_roots.msg;
    let root, word, rootmeanings, sentence;
    if (all_roots.success) {
        for (let item of all_roots.data) {
            root = item.root_word;
            word = item.word;
            rootmeanings = await stringifyMeanings(item);
            rootmeanings.length == 0
                ? (sentence = `The word ${word} comes from the root ${root}.`)
                : (sentence = `The word ${word} comes from the root ${root} and is associated with the meanings: ${rootmeanings}.`);
            item.sentence = sentence;
        }
        msg = `Successfully retreived sentences for each word in verse with id ${data.verse_id}`;
    }
    return new Result({
        data: all_roots.data,
        success: all_roots.success,
        msg: msg,
        code: all_roots.code
    });
}

async function stringifyMeanings(root) {
    let meanings = await getRootWordMeanings(root);
    let meaningsString = "";
    for (let meaning of meanings.data) {
        meaningsString
            ? (meaningsString = `${meaningsString}, ${meaning.meaning}`)
            : (meaningsString = `${meaning.meaning}`);
    }
    return meaningsString;
}

async function getMeaning(data) {
    var invalid = simpleValidation(data, {
        meaning_id: "integer",
    });
    if (invalid) {
        return invalid;
    }
    var sql = "SELECT * FROM RootMeaning WHERE meaning_id=$1;";
    var params = [data.meaning_id];
    return await validate.create(
        sql,
        params,
        new constants.Messages({
            success: `Successfully fetched a meaning with id ${data.meaning_id}.`,
            dbNotFound: `Could not find root meaning with id ${data.meaning_id}.`,
        })
    );
}

async function addMeaning(data) {
    var invalid = simpleValidation(data, {
        root_id: "integer",
        meaning: "string",
    });
    if (invalid) {
        return invalid;
    }
    var sql =
        "INSERT INTO RootMeaning (root_id, meaning) VALUES ($1, $2) RETURNING *;";
    var params = [data.root_id, data.meaning];
    return await validate.create(
        sql,
        params,
        new constants.Messages({
            success: `Successfully added a meaning to root word with id ${data.root_id}.`,
        })
    );
}

async function editMeaning(data) {
    var invalid = simpleValidation(data, {
        meaning_id: "integer",
        root_id: "integer",
        meaning: "string",
    });
    if (invalid) {
        return invalid;
    }
    var sql =
        "UPDATE RootMeaning SET meaning=$2, root_id=$3 WHERE meaning_id=$1 RETURNING *;";
    var params = [data.meaning_id, data.meaning, data.root_id];
    return await validate.create(
        sql,
        params,
        new constants.Messages({
            success: `Successfully edited meaning with id ${data.meaning_id}.`,
            dbNotFound: `Could not find a meaning with id ${data.meaning_id}.`,
        })
    );
}

async function deleteMeaning(data) {
    var invalid = simpleValidation(data, {
        meaning_id: "integer",
    });
    if (invalid) {
        return invalid;
    }
    var sql = "DELETE FROM RootMeaning WHERE meaning_id=$1 RETURNING *;";
    var params = [data.meaning_id];
    return await validate.create(
        sql,
        params,
        new constants.Messages({
            success: `Successfully deleted meaning with id ${data.meaning_id}.`,
            dbNotFound: `Could not find meaning with id ${data.meaning_id}.`,
        })
    );
}

module.exports = {
    getVerseRootWordsSentences,
    getMeaning,
    addMeaning,
    editMeaning,
    deleteMeaning,
};