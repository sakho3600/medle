import knex from "../../../knex/knex"
import { STATUS_200_OK, STATUS_400_BAD_REQUEST, STATUS_404_NOT_FOUND, METHOD_GET } from "../../../utils/http"
import { ACT_MANAGEMENT } from "../../../utils/roles"
import { checkValidUserWithPrivilege, checkHttpMethod, sendAPIError } from "../../../utils/api"

export default async (req, res) => {
   try {
      // 1 methods verification
      checkHttpMethod([METHOD_GET], req, res)

      // 2 privilege verification
      checkValidUserWithPrivilege(ACT_MANAGEMENT, req, res)

      // 3 request verification
      const { id } = req.query
      if (!id || isNaN(id)) {
         return res.status(STATUS_400_BAD_REQUEST).end()
      }

      // 4 SQL query
      const askers = await knex("askers")
         .where("id", id)
         .first()

      if (askers) {
         return res.status(STATUS_200_OK).json(askers)
      } else {
         return res.status(STATUS_404_NOT_FOUND).end()
      }
   } catch (error) {
      // 5 DB error
      console.error("API error", JSON.stringify(error))
      sendAPIError(error, res)
   }
}
