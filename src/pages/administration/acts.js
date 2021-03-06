import React from "react"
import { PropTypes } from "prop-types"
import { Container } from "reactstrap"

import { ADMIN } from "../../utils/roles"
import Layout from "../../components/Layout"
import { Title1 } from "../../components/StyledComponents"
import { withAuthentication } from "../../utils/auth"

const ActsPage = ({ currentUser }) => {
  return (
    <Layout page="acts" currentUser={currentUser} admin={true}>
      <Container
        style={{ maxWidth: 980, minWidth: 740 }}
        className="mt-5 mb-5 d-flex justify-content-between align-items-baseline"
      >
        <Title1 className="">{"Administration des actes"}</Title1>
      </Container>
    </Layout>
  )
}

ActsPage.propTypes = {
  paginatedData: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
}

export default withAuthentication(ActsPage, ADMIN)
