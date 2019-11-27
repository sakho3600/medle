import knex from "../../../lib/knex/knex"
import {
   STATUS_200_OK,
   STATUS_400_BAD_REQUEST,
   STATUS_404_NOT_FOUND,
   STATUS_500_INTERNAL_SERVER_ERROR,
} from "../../../utils/HttpStatus"

export default async (req, res) => {
   let ids

   const { id } = req.query

   if (!id) {
      return res.status(STATUS_400_BAD_REQUEST).end()
   }

   try {
      ids = await knex("acts")
         .where("id", id)
         .whereNull("deleted_at")
         .update({ deleted_at: knex.fn.now() }, ["id"])
   } catch (err) {
      return res.status(STATUS_500_INTERNAL_SERVER_ERROR).json({ message: `Erreur de base de donnée / ${err}` })
   }

   if (ids) {
      return res.status(STATUS_200_OK).end()
   } else {
      return res.status(STATUS_404_NOT_FOUND).end()
   }
}