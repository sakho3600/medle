import Cors from "micro-cors"

import { STATUS_200_OK, METHOD_GET, METHOD_OPTIONS } from "../../../utils/http"
import knex from "../../../knex/knex"
import { sendAPIError, sendMethodNotAllowedError } from "../../../services/errorHelpers"
import { STATS_GLOBAL } from "../../../utils/roles"
import { checkValidUserWithPrivilege } from "../../../utils/auth"

const handler = async (req, res) => {
  res.setHeader("Content-Type", "application/json")

  try {
    switch (req.method) {
      case METHOD_GET: {
        checkValidUserWithPrivilege(STATS_GLOBAL, req, res)

        const attacks = await knex("attacks").whereNull("deleted_at").orderBy("name", "desc").select("id", "name")

        return res.status(STATUS_200_OK).json(attacks)
      }
      default:
        if (req.method !== METHOD_OPTIONS) return sendMethodNotAllowedError(res)
    }
  } catch (error) {
    sendAPIError(error, res)
  }
}

const cors = Cors({
  allowMethods: [METHOD_GET, METHOD_OPTIONS],
})

export default cors(handler)
